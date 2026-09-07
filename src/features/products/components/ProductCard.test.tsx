// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { makeProduct } from '@/test/factories';
import ProductCard from '@/features/products/components/ProductCard';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const renderCard = (overrides: Parameters<typeof makeProduct>[0] = {}) => {
  const product = makeProduct(overrides);
  render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>
  );
  return product;
};

describe('ProductCard', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], total: 0, itemCount: 0 });
    useWishlistStore.setState({ items: [] });
    vi.clearAllMocks();
  });

  it('renders name, brand, price and rating', () => {
    renderCard({ name: 'Heritage Moonphase', brand: 'Aurum', price: 2500, rating: 4.6 });

    expect(screen.getByText('Heritage Moonphase')).toBeInTheDocument();
    expect(screen.getByText('Aurum')).toBeInTheDocument(); // uppercased via CSS only
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });

  it('adds the product to the cart when Add to Cart is clicked', async () => {
    const user = userEvent.setup();
    const product = renderCard({ id: 'p1', stock: 4 });

    await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe('p1');
    expect(state.items[0].quantity).toBe(1);
    expect(state.itemCount).toBe(1);
    expect(state.total).toBe(product.price);
  });

  it('does not add out-of-stock products to the cart', () => {
    renderCard({ id: 'p2', stock: 0 });

    // The button is disabled (also for pointer events) and shows the right label.
    const addButton = screen.getByRole('button', { name: 'Out of Stock' });
    expect(addButton).toBeDisabled();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('toggles the product in the wishlist from the heart button', async () => {
    const user = userEvent.setup();

    renderCard({ id: 'p3' });
    await user.click(screen.getByRole('button', { name: 'Add Classic Diver to wishlist' }));
    expect(useWishlistStore.getState().items.map((item) => item.productId)).toEqual(['p3']);

    await user.click(screen.getByRole('button', { name: 'Remove Classic Diver from wishlist' }));
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  it('shows a discount badge when an original price exists', () => {
    renderCard({ id: 'p4', price: 1200, originalPrice: 1500 });

    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument(); // struck-through original
  });
});
