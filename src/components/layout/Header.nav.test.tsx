// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from '@/components/layout/Header';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';

const { authStore } = vi.hoisted(() => {
  const state = {
    user: null as {
      id: string;
      email: string;
      displayName: string;
      photoURL?: string;
      role: 'user' | 'admin';
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
  };
  const listeners = new Set<() => void>();
  const authStore = Object.assign(
    (selector?: (snapshot: typeof state) => unknown) => (selector ? selector(state) : state),
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
  return { authStore, state };
});

vi.mock('@/store/auth.store', () => ({
  useAuthStore: authStore as unknown as typeof import('@/store/auth.store').useAuthStore,
}));

const member = {
  id: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  role: 'user' as const,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderHeader = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    </ThemeProvider>
  );

const openAccountMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Account menu' }));
};

describe('Header account navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], total: 0, itemCount: 0 });
    useWishlistStore.setState({ items: [] });
    authStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  });

  it('offers sign-in to guests instead of an account menu', async () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument();

    // Desktop Sign In is hidden in this viewport — guests sign in from the
    // mobile drawer, which must not expose account/admin entries either.
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('never exposes the Admin Panel entry to a non-admin member', async () => {
    authStore.setState({ user: member, isAuthenticated: true, isAdmin: false });
    renderHeader();
    await openAccountMenu();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /admin/i })).not.toBeInTheDocument();
  });

  it('shows the Admin Panel entry only for admins', async () => {
    authStore.setState({
      user: { ...member, id: 'admin-1', role: 'admin' },
      isAuthenticated: true,
      isAdmin: true,
    });
    renderHeader();
    await openAccountMenu();

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});
