import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  firebaseSignOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  apiGet: vi.fn(),
  apiRequest: vi.fn(),
  // Must be truthy at module import time: the store captures the auth instance once.
  firebaseAuth: {
    currentUser: null as { emailVerified?: boolean; reload?: () => Promise<void> } | null,
  },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.firebaseSignOut,
  updateProfile: mocks.updateProfile,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  sendEmailVerification: mocks.sendEmailVerification,
  GoogleAuthProvider: class GoogleAuthProvider {},
  multiFactor: () => ({ enrolledFactors: [], getSession: async () => ({}) }),
  getMultiFactorResolver: () => ({ hints: [] }),
  TotpMultiFactorGenerator: {
    generateSecret: async () => ({}),
    assertionForEnrollment: () => ({}),
    assertionForSignIn: () => ({}),
  },
}));

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: () => mocks.firebaseAuth,
}));

vi.mock('@/lib/axios', () => ({
  default: { get: mocks.apiGet, request: mocks.apiRequest },
}));

import { useAuthStore } from '@/store/auth.store';
import { makeUser } from '@/test/factories';
import { flushPromises } from '@/test/factories';

const fakeFirebaseUser = {
  uid: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: undefined as string | undefined,
  emailVerified: true,
  metadata: { creationTime: '2024-01-01T00:00:00Z' },
  reload: vi.fn(),
};

type AuthListener = (firebaseUser: unknown) => void;
let authListener: AuthListener | undefined;

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    authListener = undefined;
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  });

  it('stays signed out when initialize receives no user', async () => {
    mocks.onAuthStateChanged.mockImplementation((_auth: unknown, callback: AuthListener) => {
      authListener = callback;
      return () => undefined;
    });
    mocks.apiGet.mockResolvedValue({ data: [{ role: 'user' }] });

    useAuthStore.getState().initialize();
    authListener?.(null);
    await flushPromises();

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('hydrates the user and resolves admin status on initialize', async () => {
    mocks.onAuthStateChanged.mockImplementation((_auth: unknown, callback: AuthListener) => {
      authListener = callback;
      return () => undefined;
    });
    mocks.apiGet.mockResolvedValue({ data: [{ role: 'admin' }] });

    useAuthStore.getState().initialize();
    authListener?.(fakeFirebaseUser);
    await flushPromises();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('alice@example.com');
    expect(state.isAdmin).toBe(true);
    expect(state.user?.role).toBe('admin');
    expect(mocks.apiGet).toHaveBeenCalledWith('/admin/alice@example.com');
  });

  it('signs in and flags non-admin users', async () => {
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: fakeFirebaseUser });
    mocks.apiGet.mockResolvedValue({ data: [{ role: 'user' }] });

    await useAuthStore.getState().signIn('alice@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('user-1');
    expect(state.isAdmin).toBe(false);
    // Firebase conversion carries the verified flag through to the app user.
    expect(state.user?.emailVerified).toBe(true);
  });

  it('sends a password reset email through Firebase', async () => {
    mocks.sendPasswordResetEmail.mockResolvedValue(undefined);

    await useAuthStore.getState().resetPassword('alice@example.com');

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      mocks.firebaseAuth,
      'alice@example.com'
    );
  });

  it('rejects resets when Firebase is not configured', async () => {
    await expect(useAuthStore.getState().sendEmailVerification()).rejects.toThrow(
      'You must be signed in to verify your email.'
    );
  });

  it('sends a verification email to the signed-in account', async () => {
    const currentUser = { ...fakeFirebaseUser, emailVerified: false };
    mocks.firebaseAuth.currentUser = currentUser;
    mocks.sendEmailVerification.mockResolvedValue(undefined);
    useAuthStore.setState({
      user: { ...makeUser(), emailVerified: false },
      isAuthenticated: true,
    });

    await useAuthStore.getState().sendEmailVerification();

    expect(mocks.sendEmailVerification).toHaveBeenCalledWith(currentUser);
    mocks.firebaseAuth.currentUser = null;
  });

  it('skips sending a verification email when the account is already verified', async () => {
    const currentUser = { ...fakeFirebaseUser, emailVerified: true };
    mocks.firebaseAuth.currentUser = currentUser;
    useAuthStore.setState({ user: makeUser(), isAuthenticated: true });

    await useAuthStore.getState().sendEmailVerification();

    expect(mocks.sendEmailVerification).not.toHaveBeenCalled();
    mocks.firebaseAuth.currentUser = null;
  });

  it('refreshAuthState re-reads verification status from Firebase', async () => {
    const currentUser = { ...fakeFirebaseUser, emailVerified: false };
    mocks.firebaseAuth.currentUser = currentUser;
    useAuthStore.setState({
      user: { ...makeUser(), emailVerified: false },
      isAuthenticated: true,
    });

    // The user clicks the link in the email; the next check sees it verified.
    currentUser.emailVerified = true;
    await useAuthStore.getState().refreshAuthState();

    expect(currentUser.reload).toHaveBeenCalled();
    expect(useAuthStore.getState().user?.emailVerified).toBe(true);
    mocks.firebaseAuth.currentUser = null;
  });

  it('rejects failed sign in and clears the loading flag', async () => {
    mocks.signInWithEmailAndPassword.mockRejectedValue(new Error('Firebase: wrong password.'));

    await expect(
      useAuthStore.getState().signIn('alice@example.com', 'wrong-password')
    ).rejects.toThrow('wrong password');
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('signs out and clears the user', async () => {
    mocks.firebaseSignOut.mockResolvedValue(undefined);
    useAuthStore.setState({ user: makeUser(), isAuthenticated: true, isAdmin: true });

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isAdmin).toBe(false);
  });
});
