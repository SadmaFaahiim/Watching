// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

const config = (method: string, url: string, data?: unknown): InternalAxiosRequestConfig =>
  ({
    method,
    url,
    data: data === undefined ? undefined : JSON.stringify(data),
    headers: {},
  }) as unknown as InternalAxiosRequestConfig;

const loadAdapter = async () => (await import('@/mocks/adapter')).mockApiAdapter;

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('mock adapter — reviews, promo codes & refunds', () => {
  it('serves seeded reviews per product with coherent aggregates', async () => {
    const adapter = await loadAdapter();
    const reviews = (await adapter(config('get', '/reviews?productId=p1&pageSize=100'))).data
      .data as { productId: string }[];
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every((review) => review.productId === 'p1')).toBe(true);

    // The product aggregate always matches its review rows.
    const product = (await adapter(config('get', '/products/p1'))).data;
    expect(product.reviewCount).toBe(reviews.length);
  });

  it('validates reviews and publishes a verified one that updates aggregates', async () => {
    const adapter = await loadAdapter();
    await expect(
      adapter(config('post', '/reviews', { productId: 'p1', rating: 9, title: 'x', comment: 'y' }))
    ).rejects.toMatchObject({ message: /Rating must be/ });

    const before = (await adapter(config('get', '/reviews?productId=p4&pageSize=100'))).data.data
      .length;
    const created = await adapter(
      config('post', '/reviews', {
        productId: 'p4',
        rating: 5,
        title: 'Masterpiece',
        comment: 'Gorgeous finishing and faultless timekeeping after a month on the wrist.',
        userId: 'demo-user', // demo user has a delivered order containing p4
        userName: 'Demo Admin',
      })
    );
    expect(created.status).toBe(201);
    expect(created.data.review.verified).toBe(true);
    // Aggregates recomputed server-side.
    expect(created.data.product.reviewCount).toBe(before + 1);

    vi.resetModules();
    const data = await import('@/mocks/data');
    expect(data.seedReviews.length).toBeGreaterThan(before);
    const persisted = data.seedReviews.find((review) => review.title === 'Masterpiece');
    expect(persisted?.verified).toBe(true);
    expect(data.seedProducts.find((item) => item.id === 'p4')?.reviewCount).toBe(before + 1);
  });

  it('counts helpful votes and lets admins delete a review', async () => {
    const adapter = await loadAdapter();
    const first = (await adapter(config('get', '/reviews?productId=p2&pageSize=10'))).data
      .data[0] as { id: string; helpful: number };

    const voted = await adapter(config('post', `/reviews/${first.id}/helpful`));
    expect(voted.data.helpful).toBe(first.helpful + 1);

    const productBefore = (await adapter(config('get', '/products/p2'))).data;
    await adapter(config('delete', `/reviews/${first.id}`));
    const productAfter = (await adapter(config('get', '/products/p2'))).data;
    expect(productAfter.reviewCount).toBe(Math.max(0, productBefore.reviewCount - 1));
  });

  it('validates promo codes with user-safe errors and enforces min orders', async () => {
    const adapter = await loadAdapter();

    const ok = await adapter(config('get', '/promos/WELCOME10?subtotal=100'));
    expect(ok.data.code).toBe('WELCOME10');

    await expect(adapter(config('get', '/promos/NOPE?subtotal=100'))).rejects.toMatchObject({
      message: 'Invalid promo code.',
    });

    // SUMMER20 requires an $800 minimum order.
    await expect(adapter(config('get', '/promos/SUMMER20?subtotal=100'))).rejects.toMatchObject({
      message: /minimum order/,
    });
  });

  it('redeems a promo on order placement and stores the discount line', async () => {
    const adapter = await loadAdapter();
    const product = (await adapter(config('get', '/products/p1'))).data;

    const created = await adapter(
      config('post', '/orders', {
        userId: 'demo-user',
        items: [{ productId: 'p1', quantity: 3, product }],
        subtotal: product.price * 3,
        shipping: 0,
        tax: 0,
        promoCode: 'SUMMER20',
        paymentMethod: 'card',
      })
    );
    expect(created.data.promoCode).toBe('SUMMER20');
    expect(created.data.discount).toBe(150); // capped maxDiscount
    expect(created.status).toBe(201);

    vi.resetModules();
    const data = await import('@/mocks/data');
    const promo = data.seedPromoCodes.find((item) => item.code === 'SUMMER20');
    expect(promo?.usedCount).toBe(4); // 3 seeded + this redemption
    const order = data.seedOrders.find((item) => item.id === created.data.id);
    expect(order?.promoCode).toBe('SUMMER20');
  });

  it('refunds a paid order once and rejects ineligible orders', async () => {
    const adapter = await loadAdapter();

    const refunded = await adapter(config('patch', '/orders/o2/refund'));
    expect(refunded.data.paymentStatus).toBe('refunded');
    const lastEvent = refunded.data.history[refunded.data.history.length - 1];
    expect(lastEvent.action).toBe('Refund issued');

    await expect(adapter(config('patch', '/orders/o2/refund'))).rejects.toMatchObject({
      message: /Only paid, non-cancelled orders/,
    });

    // COD order still pending cannot be refunded.
    await expect(adapter(config('patch', '/orders/o4/refund'))).rejects.toMatchObject({
      message: /Only paid, non-cancelled orders/,
    });
  });
});
