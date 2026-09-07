import { useEffect, useRef } from 'react';
import { openBroadcastChannel } from '@/lib/broadcastChannel';
import { useCompareStore } from '@/store/compare.store';
import type { Product } from '@/types';

const CHANNEL_NAME = 'classic-watch-compare-tab';

/**
 * Keep the compare drawer contents in sync across open same-origin tabs.
 *
 * Local mutations to the compare store are broadcast as `compare-sync`
 * messages; incoming messages replace the local list. A ref flag guards
 * against echo loops (the remote apply re-triggers the local subscriber).
 *
 * Falls back to a no-op when `BroadcastChannel` is unavailable.
 */
export function useCrossTabCompareSync(): void {
  const channelRef = useRef<BroadcastChannel | null>(null);
  if (channelRef.current === null) {
    channelRef.current = openBroadcastChannel(CHANNEL_NAME);
  }
  const applyingRemote = useRef(false);

  // Receive: replace the local list with another tab's items.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const onmessage = (event: MessageEvent<{ type?: string; items?: unknown }>) => {
      const payload = event.data;
      if (!payload || payload.type !== 'compare-sync' || !Array.isArray(payload.items)) {
        return;
      }
      applyingRemote.current = true;
      try {
        useCompareStore.getState().replaceItems(payload.items as Product[]);
      } finally {
        applyingRemote.current = false;
      }
    };

    channel.addEventListener('message', onmessage);
    return () => channel.removeEventListener('message', onmessage);
  }, []);

  // Broadcast: announce local list changes to other tabs.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const unsubscribe = useCompareStore.subscribe((state, prevState) => {
      if (applyingRemote.current) return;
      if (state.items === prevState.items) return;
      channel.postMessage({ type: 'compare-sync', items: state.items });
    });
    return unsubscribe;
  }, []);
}