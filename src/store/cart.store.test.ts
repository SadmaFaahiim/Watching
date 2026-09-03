import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/store/cart.store';
import { makeProduct } from '@/test/factories';

const STORAGE_KEY = 'cart-storage';

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], total: 0, itemCount: 0 });
  });

  it('starts empty', () => {
    const { items, total, itemCount } = useCartStore.getState();
    expect(items).toEqual([]);
    expect(total).toBe(0);
    expect(itemCount).toBe(0);
  });

  it('adds an item and computes totals', () => {
    const product = makeProduct({ id: 'p1', price: 2500 });
    useCartStore.getState().addItem(product, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.itemCount).toBe(2);
    expect(state.total).toBe(5000);
  });

  it('increments quantity instead of duplicating an existing item', () => {
    const product = makeProduct({ id: 'p1', price: 100 });
    const { addItem } = useCartStore.getState();

    addItem(product);
    addItem(product, 3);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(4);
    expect(state.itemCount).toBe(4);
    expect(state.total).toBe(400);
  });

  it('updates quantity and recalculates totals', () => {
    const product = makeProduct({ id: 'p1', price: 200 });
    useCartStore.getState().addItem(product);

    useCartStore.getState().updateQuantity('p1', 3);
    expect(useCartStore.getState().total).toBe(600);

    useCartStore.getState().updateQuantity('p1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().itemCount).toBe(0);
  });

  it('removes an item and recalculates totals', () => {
    const first = makeProduct({ id: 'p1', price: 100 });
    const second = makeProduct({ id: 'p2', price: 300 });
    useCartStore.getState().addItem(first);
    useCartStore.getState().addItem(second);

    useCartStore.getState().removeItem('p1');

    const state = useCartStore.getState();
    expect(state.items.map((item) => item.productId)).toEqual(['p2']);
    expect(state.total).toBe(300);
    expect(state.itemCount).toBe(1);
  });

  it('clears the whole cart', () => {
    useCartStore.getState().addItem(makeProduct({ id: 'p1', price: 100 }), 2);
    useCartStore.getState().addItem(makeProduct({ id: 'p2', price: 50 }), 1);

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().total).toBe(0);
    expect(useCartStore.getState().itemCount).toBe(0);
  });

  it('persists its state to localStorage', () => {
    const product = makeProduct({ id: 'p1', price: 1500 });
    useCartStore.getState().addItem(product);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      state?: { items?: { productId: string; quantity: number }[]; total?: number };
    };
    expect(persisted.state?.items).toHaveLength(1);
    expect(persisted.state?.items?.[0]).toMatchObject({ productId: 'p1', quantity: 1 });
    expect(persisted.state?.total).toBe(1500);
  });
});
