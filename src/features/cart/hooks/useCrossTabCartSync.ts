import { useEffect, useRef } from 'react';
import { openBroadcastChannel } from '@/lib/broadcastChannel';
import { useCartStore } from '@/store/cart.store';
import type { CartItem } from '@/types';

const CHANNEL_NAME = 'classic-watch-cart-tab';

/**
 * Keep the cart contents in sync across open same-origin tabs.
 *
 * Local cart mutations are broadcast as `cart-sync` messages; incoming
 * messages replace the local items list (the most recent tab wins). A ref
 * flag guards against echo loops.
 *
 * Falls back to a no-op when `BroadcastChannel` is unavailable.
 */
export function useCrossTabCartSync(): void {
  const channelRef = useRef<BroadcastChannel | null>(null);
  if (channelRef.current === null) {
    channelRef.current = openBroadcastChannel(CHANNEL_NAME);
  }
  const applyingRemote = useRef(false);

  // Receive: replace the local cart with another tab's items.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const onmessage = (event: MessageEvent<{ type?: string; items?: unknown }>) => {
      const payload = event.data;
      if (!payload || payload.type !== 'cart-sync' || !Array.isArray(payload.items)) {
        return;
      }
      applyingRemote.current = true;
      try {
        useCartStore.setState({ items: payload.items as CartItem[] });
        useCartStore.getState().calculateTotal();
      } finally {
        applyingRemote.current = false;
      }
    };

    channel.addEventListener('message', onmessage);
    return () => channel.removeEventListener('message', onmessage);
  }, []);

  // Broadcast: announce local cart changes to other tabs.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const unsubscribe = useCartStore.subscribe((state, prevState) => {
      if (applyingRemote.current) return;
      if (state.items === prevState.items) return;
      channel.postMessage({ type: 'cart-sync', items: state.items });
    });
    return unsubscribe;
  }, []);
}
