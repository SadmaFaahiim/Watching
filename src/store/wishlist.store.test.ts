import { beforeEach, describe, expect, it } from 'vitest';
import { useWishlistStore } from '@/store/wishlist.store';

describe('wishlist store', () => {
  beforeEach(() => {
    localStorage.clear();
    useWishlistStore.setState({ items: [] });
  });

  it('starts empty', () => {
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it('adds a product id to the wishlist', () => {
    useWishlistStore.getState().addToWishlist('p1');

    const items = useWishlistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('p1');
    expect(useWishlistStore.getState().isInWishlist('p1')).toBe(true);
  });

  it('ignores duplicate additions', () => {
    useWishlistStore.getState().addToWishlist('p1');
    useWishlistStore.getState().addToWishlist('p1');

    expect(useWishlistStore.getState().items).toHaveLength(1);
  });

  it('removes a product from the wishlist', () => {
    useWishlistStore.getState().addToWishlist('p1');
    useWishlistStore.getState().removeFromWishlist('p1');

    expect(useWishlistStore.getState().isInWishlist('p1')).toBe(false);
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it('clears the wishlist', () => {
    useWishlistStore.getState().addToWishlist('p1');
    useWishlistStore.getState().addToWishlist('p2');
    useWishlistStore.getState().clearWishlist();

    expect(useWishlistStore.getState().items).toEqual([]);
  });
});
