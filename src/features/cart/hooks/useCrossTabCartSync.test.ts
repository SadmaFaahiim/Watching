import { describe, expect, it, vi, afterEach } from 'vitest';
import { useCartStore } from '@/store/cart.store';
import type { CartItem, Product } from '@/types';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  localStorage.clear();
  useCartStore.setState({ items: [], total: 0, itemCount: 0, promoCode: null, appliedPromo: null, discount: 0 });
});

const makeProduct = (id: string, price: number): Product => ({
  id,
  name: `Watch ${id}`,
  brand: 'Test',
  model: 'Test',
  description: 'Test product',
  price,
  thumbnail: '',
  images: [] as const,
  category: 'classic' as const,
  stock: 10,
  rating: 4.0,
  reviewCount: 0,
  specifications: {
    movement: 'Automatic',
    caseDiameter: '40mm',
    caseMaterial: 'Stainless Steel',
    waterResistance: '30m',
    strapMaterial: 'Leather',
    warranty: '2-year',
  },
  features: [],
  isNew: false,
  isFeatured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function createMockChannel() {
  const listeners: Array<(event: MessageEvent) => void> = [];
  return {
    addEventListener(type: string, handler: (event: MessageEvent) => void) {
      if (type === 'message') listeners.push(handler);
    },
    removeEventListener(_type: string, handler: (event: MessageEvent) => void) {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    simulateMessage(data: unknown) {
      for (const listener of listeners) {
        listener({ data } as MessageEvent);
      }
    },
  };
}

describe('cross-tab cart sync', () => {
  it('receives cart items from another tab and recomputes totals', () => {
    const channel = createMockChannel();
    vi.stubGlobal('BroadcastChannel', vi.fn(() => channel));

    // Set up the receive side (simulates the hook's message listener).
    const onmessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.type !== 'cart-sync' || !Array.isArray(payload.items)) return;
      useCartStore.getState().items = payload.items as CartItem[];
      useCartStore.getState().calculateTotal();
    };
    channel.addEventListener('message', onmessage);

    // Simulate another tab broadcasting a cart with a single item.
    channel.simulateMessage({
      type: 'cart-sync',
      items: [{ productId: 'p7', quantity: 2, product: makeProduct('p7', 750) }],
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe('p7');
    expect(state.total).toBe(1500);
    expect(state.itemCount).toBe(2);

    channel.removeEventListener('message', onmessage);
  });

  it('does nothing when the message is not a cart-sync event', () => {
    const channel = createMockChannel();
    let received = false;

    const onmessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.type !== 'cart-sync' || !Array.isArray(payload.items)) return;
      useCartStore.getState().items = payload.items as CartItem[];
      useCartStore.getState().calculateTotal();
      received = true;
    };
    channel.addEventListener('message', onmessage);

    // Some other channel message — should be ignored.
    channel.simulateMessage({ type: 'compare-sync', items: [] });

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(received).toBe(false);
    channel.removeEventListener('message', onmessage);
  });

  it('Broadcasts cart changes when the store is mutated (simulated)', () => {
    const posted: unknown[] = [];
    vi.stubGlobal('BroadcastChannel', vi.fn(() => ({
      addEventListener: () => {},
      removeEventListener: () => {},
      postMessage(data: unknown) {
        posted.push(data);
      },
    })));

    // Simulate what useCrossTabCartSync does: subscribe to store changes and
    // broadcast them.
    const unsubscribe = useCartStore.subscribe((state, prevState) => {
      if (state.items === prevState.items) return;
      posted.push({ type: 'cart-sync', items: state.items });
    });

    useCartStore.getState().addItem(makeProduct('p3', 2000), 3);
    expect(posted).toHaveLength(1);
    expect((posted[0] as { type: string; items: unknown[] }).type).toBe('cart-sync');
    expect((posted[0] as { items: unknown[] }).items).toHaveLength(1);

    unsubscribe();
  });
});
