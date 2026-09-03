// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Deterministic auth: mock the store with a controllable snapshot so each test
// can impersonate guests, members, admins, and unverified users.
const { authStore } = vi.hoisted(() => {
  const state = {
    user: null as {
      id: string;
      email: string;
      displayName: string;
      role: 'user' | 'admin';
      emailVerified: boolean;
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

// Keep the email-verification gate active (mockApiEnabled false → the gate
// applies to unverified accounts, mirroring real Firebase usage).
vi.mock('@/config', () => ({ mockApiEnabled: false }));

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';

const member = {
  id: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  role: 'user' as const,
  emailVerified: true,
};

const admin = { ...member, id: 'admin-1', role: 'admin' as const, displayName: 'Priya' };

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="pathname">{location.pathname}</span>;
};

const renderGuarded = (route: string, element: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={route} element={element} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/verify-email" element={<div>Verify email page</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  });

  it('shows a loading state while auth resolves (no flash redirect)', () => {
    authStore.setState({ isLoading: true });
    renderGuarded(
      '/dashboard',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/dashboard');
  });

  it('redirects guests to the login page', () => {
    renderGuarded(
      '/dashboard',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/login');
  });

  it('renders children for a verified signed-in user', () => {
    authStore.setState({ user: member, isAuthenticated: true, isAdmin: false });
    renderGuarded(
      '/dashboard',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('routes unverified Firebase users to the email-verification page', () => {
    authStore.setState({
      user: { ...member, emailVerified: false },
      isAuthenticated: true,
      isAdmin: false,
    });
    renderGuarded(
      '/dashboard',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Verify email page')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/verify-email');
  });

  it('treats accounts without an explicit verification flag as verified', () => {
    const legacyUser = {
      id: member.id,
      email: member.email,
      displayName: member.displayName,
      role: member.role,
    };
    authStore.setState({
      user: legacyUser as typeof member,
      isAuthenticated: true,
      isAdmin: false,
    });
    renderGuarded(
      '/dashboard',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  beforeEach(() => {
    authStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  });

  it('redirects guests to the login page', () => {
    renderGuarded(
      '/admin',
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows an access-denied screen for authenticated non-admins', () => {
    authStore.setState({ user: member, isAuthenticated: true, isAdmin: false });
    renderGuarded(
      '/admin',
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/admin');
  });

  it('renders children for admins', () => {
    authStore.setState({ user: admin, isAuthenticated: true, isAdmin: true });
    renderGuarded(
      '/admin',
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('routes unverified admins to the email-verification page', () => {
    authStore.setState({
      user: { ...admin, emailVerified: false },
      isAuthenticated: true,
      isAdmin: true,
    });
    renderGuarded(
      '/admin',
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText('Verify email page')).toBeInTheDocument();
  });
});
