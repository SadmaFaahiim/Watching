// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart.store';
import { makeProduct, flushPromises } from '@/test/factories';
import type { Order } from '@/types';
import CheckoutPage from '@/features/cart/pages/CheckoutPage';

// Mock the mutation hook so the placement step is deterministic — no real
// axios / mock-adapter round trip required.
const { mutateAsync, isPendingMock, demoUser, authStore } = vi.hoisted(() => {
  const mutateAsync = vi.fn();
  let pending = false;
  const demoUser = {
    id: 'demo-user',
    email: 'demo@classicwatch.local',
    displayName: 'Demo Admin',
    photoURL: undefined as string | undefined,
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const state = {
    user: null as typeof demoUser | null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
  };
  const listeners = new Set<() => void>();
  const authStore = Object.assign(
    (selector: (snapshot: typeof state) => unknown) => selector(state),
    {
      getState: () => state,
      setState: (partial: Partial<typeof state>) => {
        Object.assign(state, partial);
        listeners.forEach((listener) => listener());
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => void listeners.delete(listener);
      },
    }
  );

  return {
    mutateAsync,
    isPendingMock: { get: () => pending, set: (value: boolean) => void (pending = value) },
    demoUser,
    authStore,
  };
});

// Deterministic env: disable real mock-API wiring and drive the auth store
// explicitly so the checkout flow always runs with a signed-in user.
vi.mock('@/config', () => ({
  mockApiEnabled: false,
  demoUser,
  demoUserId: 'demo-user',
  default: {
    apiBaseUrl: 'http://localhost',
    mockApiEnabled: false,
    firebase: {},
    features: { darkMode: true, pwa: false, analytics: false },
  },
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: authStore as unknown as typeof import('@/store/auth.store').useAuthStore,
}));

vi.mock('@/api/orders.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/orders.api')>();
  return {
    ...actual,
    useCreateOrder: () => ({
      mutateAsync,
      isPending: isPendingMock.get(),
      isError: false,
      isSuccess: false,
      reset: vi.fn(),
    }),
  };
});

const makeOrder = (): Order => ({
  id: 'o-new',
  userId: 'demo-user',
  items: [],
  subtotal: 2000,
  shipping: 0,
  tax: 100,
  total: 2100,
  shippingAddress: {
    fullName: 'Demo Admin',
    phone: '+15550102030',
    addressLine1: '12 Lakeview Avenue',
    city: 'Geneva',
    state: 'GE',
    postalCode: '1204',
    country: 'Switzerland',
  },
  orderStatus: 'pending',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  let pathname = '';
  const LocationProbe = () => {
    pathname = useLocation().pathname;
    return null;
  };

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:id" element={<div>Order detail page</div>} />
          <Route path="/products" element={<div>Products page</div>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { getPathname: () => pathname, ...utils };
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], total: 0, itemCount: 0 });
    authStore.setState({
      user: demoUser,
      isAuthenticated: true,
      isAdmin: true,
      isLoading: false,
    });
    mutateAsync.mockReset();
    isPendingMock.set(false);
    // Sign the demo user in so the checkout does not bounce to login.
    useCartStore.getState().addItem(makeProduct({ id: 'p1', name: 'Diver Pro 300', price: 2000 }));
  });

  it('shows the empty-cart state when nothing is in the cart', () => {
    useCartStore.setState({ items: [], total: 0, itemCount: 0 });
    renderPage();

    expect(screen.getByText('Nothing to check out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore products' })).toBeInTheDocument();
  });

  it('blocks advancing when required fields are empty', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Shipping details')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Validation messages surface asynchronously for the invalid fields.
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      expect(screen.getByText('Please enter your street address')).toBeInTheDocument();
      expect(screen.getByText('Please enter your postal code')).toBeInTheDocument();
      expect(screen.getByText('Please select your country')).toBeInTheDocument();
    });

    // Required fields are flagged as invalid. Full name is pre-filled from the
    // demo user's displayName, so assert on a genuinely empty field instead.
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByLabelText(/phone/i)).toHaveAttribute('aria-invalid', 'true');

    // Still on the shipping step — the step was blocked.
    expect(screen.getByText('Shipping details')).toBeInTheDocument();
    expect(screen.queryByText('Payment method')).not.toBeInTheDocument();
  });

  it('walks through shipping → payment → review and places the order', async () => {
    const user = userEvent.setup();
    const { getPathname } = renderPage();

    mutateAsync.mockResolvedValue(makeOrder());

    // Step 1 — shipping.
    await user.type(screen.getByLabelText(/full name/i), 'Demo Admin');
    await user.type(screen.getByLabelText(/phone/i), '+1 555 010 2030');
    await user.type(screen.getByLabelText(/^address line 1/i), '12 Lakeview Avenue');
    await user.type(screen.getByLabelText(/^city/i), 'Geneva');
    await user.type(screen.getByLabelText(/postal code/i), '1204');

    // Country is a Select (combobox) — pick via the MUI popup list.
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Switzerland' }));

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Payment method')).toBeInTheDocument();

    // Step 2 — payment (card is pre-selected; fill in card fields).
    await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
    await user.type(screen.getByLabelText(/expiry/i), '12/29');
    await user.type(screen.getByLabelText(/cvc/i), '123');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 3 — review.
    expect(await screen.findByText('Review your order')).toBeInTheDocument();
    expect(screen.getByText('Diver Pro 300')).toBeInTheDocument();

    // Place the order.
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mutateAsync.mock.calls[0]?.[0] as { paymentMethod: string; total: number };
    expect(payload.paymentMethod).toBe('card');
    expect(payload.total).toBeGreaterThan(2000);

    await flushPromises();
    // Cart is cleared and the user is taken to the new order.
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(getPathname()).toBe('/orders/o-new');
    expect(screen.getByText('Order detail page')).toBeInTheDocument();
  });
});
