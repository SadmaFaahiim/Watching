// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { makeProduct } from '@/test/factories';
import CartPage from '@/features/cart/pages/CartPage';

// The store writes to localStorage on every change via persist middleware.
const renderPage = () => {
  let pathname = '';
  const LocationProbe = () => {
    pathname = useLocation().pathname;
    return null;
  };

  const utils = render(
    <MemoryRouter initialEntries={['/cart']}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<div>Checkout page</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
  return { getPathname: () => pathname, ...utils };
};

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], total: 0, itemCount: 0 });
  });

  it('shows an empty state with a CTA to browse products', () => {
    renderPage();

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    // MUI Button renders as an anchor when used with RouterLink.
    expect(screen.getByRole('link', { name: 'Explore products' })).toBeInTheDocument();
    // The empty branch must keep the page h1 (a11y: heading order).
    expect(screen.getByRole('heading', { level: 1, name: 'Shopping Cart' })).toBeInTheDocument();
  });

  it('lists cart items with totals and quantity controls', async () => {
    const user = userEvent.setup();
    const first = makeProduct({ id: 'p1', name: 'Diver Pro 300', price: 2200 });
    const second = makeProduct({ id: 'p2', name: 'Dress 36', price: 1100 });

    useCartStore.getState().addItem(first, 1);
    useCartStore.getState().addItem(second, 2);

    renderPage();

    expect(screen.getByText('Diver Pro 300')).toBeInTheDocument();
    expect(screen.getByText('Dress 36')).toBeInTheDocument();
    // 2200 + 2×1100 — store total and line total (Dress 36) both equal this.
    expect(useCartStore.getState().total).toBe(4400);
    expect(screen.getAllByText('$4,400.00').length).toBe(2);

    // Increase the second item's quantity.
    await user.click(screen.getByRole('button', { name: 'Increase quantity of Dress 36' }));
    expect(useCartStore.getState().items.find((item) => item.productId === 'p2')?.quantity).toBe(3);

    // Store total is recalculated (2200 + 3 × 1100) and the UI shows it.
    expect(useCartStore.getState().total).toBe(5500);
    expect(screen.getAllByText('$5,500.00').length).toBeGreaterThanOrEqual(1);
  });

  it('removes an item from the cart', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(makeProduct({ id: 'p1', name: 'Diver Pro 300', price: 2200 }));

    renderPage();
    expect(screen.getByText('Diver Pro 300')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Diver Pro 300 from cart' }));

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.queryByText('Diver Pro 300')).not.toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('navigates to checkout from the summary', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(makeProduct({ id: 'p1', name: 'Diver Pro 300', price: 2200 }));

    const { getPathname } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Proceed to Checkout' }));

    expect(getPathname()).toBe('/checkout');
    expect(screen.getByText('Checkout page')).toBeInTheDocument();
  });
});
