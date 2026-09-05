import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/store/cart.store';
import { makeProduct } from '@/test/factories';
import type { PromoCode } from '@/types';

const makePromo = (overrides: Partial<PromoCode> = {}): PromoCode => ({
  id: 'promo-1',
  code: 'WELCOME10',
  type: 'percent',
  value: 10,
  usedCount: 0,
  active: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

describe('cart store promo codes', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({
      items: [],
      total: 0,
      itemCount: 0,
      promoCode: null,
      appliedPromo: null,
      discount: 0,
    });
  });

  it('applies a percent promo and recomputes on quantity changes', () => {
    const product = makeProduct({ id: 'p1', price: 1000 });
    useCartStore.getState().addItem(product, 2);
    expect(useCartStore.getState().total).toBe(2000);

    useCartStore.getState().applyPromoCode(makePromo());
    expect(useCartStore.getState().discount).toBe(200);

    // Quantity drops → discount follows the new subtotal.
    useCartStore.getState().updateQuantity('p1', 1);
    expect(useCartStore.getState().total).toBe(1000);
    expect(useCartStore.getState().discount).toBe(100);
  });

  it('caps a fixed promo at the subtotal and honors a max discount', () => {
    const product = makeProduct({ id: 'p1', price: 100 });
    useCartStore.getState().addItem(product);
    useCartStore
      .getState()
      .applyPromoCode(makePromo({ code: 'FIXED500', type: 'fixed', value: 500 }));
    expect(useCartStore.getState().discount).toBe(100);

    const pricey = makeProduct({ id: 'p9', price: 2000 });
    useCartStore.getState().addItem(pricey);
    useCartStore
      .getState()
      .applyPromoCode(makePromo({ code: 'CAP100', type: 'percent', value: 25, maxDiscount: 100 }));
    expect(useCartStore.getState().discount).toBe(100);
  });

  it('removes the promo and lets clearCart reset everything', () => {
    const product = makeProduct({ id: 'p1', price: 500 });
    useCartStore.getState().addItem(product);
    useCartStore.getState().applyPromoCode(makePromo());
    expect(useCartStore.getState().discount).toBe(50);

    useCartStore.getState().removePromoCode();
    expect(useCartStore.getState().discount).toBe(0);
    expect(useCartStore.getState().promoCode).toBeNull();

    useCartStore.getState().applyPromoCode(makePromo());
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().appliedPromo).toBeNull();
    expect(useCartStore.getState().discount).toBe(0);
    expect(useCartStore.getState().total).toBe(0);
  });
});
