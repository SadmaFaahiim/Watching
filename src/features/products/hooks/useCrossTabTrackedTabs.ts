import { useRef, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { useRecentlyViewedStore } from '@/store/recentlyViewed.store';
import { openBroadcastChannel } from '@/lib/broadcastChannel';

type CrossTabEvent =
  | { type: 'product-focus'; product: Product }
  | { type: 'product-blur' };

interface TrackedTabsResult {
  /** Announce the currently focused product to other same-origin tabs.
   * Pass `null` when the tab leaves the product view so other tabs can
   * stop tracking it as "focused".
   */
  setCurrent: (product: Product | null) => void;
}

const CHANNEL_NAME = 'classic-watch-cross-tab';

/** Track a product across multiple tabs via `BroadcastChannel`.
 *
 * When another tab announces a product focus, the local recently-viewed store
 * records it. The broadcast-side effect is guarded so it never depends on
 * mutable closure values — the listener is installed once per mount and only
 * posts when a fresh `product` ref is supplied.
 *
 * Falls back to a no-op when `BroadcastChannel` is unavailable (e.g. jsdom).
 */
export function useCrossTabTrackedTabs(): TrackedTabsResult {
  const record = useRecentlyViewedStore((state) => state.record);
  const channelRef = useRef<BroadcastChannel | null>(null);

  if (channelRef.current === null) {
    channelRef.current = openBroadcastChannel(CHANNEL_NAME);
  }

  const focusedRef = useRef<Product | null>(null);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const onmessage = (event: MessageEvent<CrossTabEvent>) => {
      const payload = event.data;
      if (!payload || payload.type !== 'product-focus') return;
      record(payload.product);
    };

    channel.addEventListener('message', onmessage);
    return () => channel.removeEventListener('message', onmessage);
  }, [record]);

  const setCurrent = useCallback(
    (product: Product | null) => {
      focusedRef.current = product;
      const channel = channelRef.current;
      if (!channel) return;

      if (product) {
        channel.postMessage({ type: 'product-focus', product: { ...product } });
      } else {
        channel.postMessage({ type: 'product-blur' });
      }
    },
    [channelRef]
  );

  return { setCurrent };
}
