import { beforeEach, describe, expect, it, vi } from 'vitest';

// Demo mode: no Firebase auth instance, mock API enabled — every 2FA path
// below exercises the in-memory directory + seed database.
vi.mock('@/lib/firebase', () => ({
  initializeFirebase: async () => undefined,
  getFirebaseAuth: () => undefined,
}));

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), request: vi.fn() },
}));

vi.mock('@/config', () => ({
  mockApiEnabled: true,
  demoUserId: 'demo-user',
  demoUser: {
    id: 'demo-user',
    email: 'demo@classicwatch.local',
    displayName: 'Demo Admin',
    photoURL: undefined,
    role: 'admin',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}));

import { useAuthStore } from '@/store/auth.store';
import { seedUsers } from '@/mocks/data';

const demoSeedUser = () => seedUsers.find((user) => user.id === 'demo-user');

const resetSeedAccount = () => {
  const account = demoSeedUser();
  if (account) {
    account.mfaEnabled = false;
    account.mfaEnrolledAt = undefined;
    account.passkeys = [];
  }
};

describe('auth store — two-factor authentication (demo path)', () => {
  beforeEach(() => {
    resetSeedAccount();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      pendingMfa: null,
    });
  });

  it('enrolls TOTP and completes the sign-in challenge', async () => {
    // Sign in normally (no 2FA yet).
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().pendingMfa).toBeNull();

    // Enroll: step 1 produces a secret, step 2 confirms with a 6-digit code.
    const setup = await useAuthStore.getState().enableTotp();
    expect(setup.secret).toMatch(/^[A-Z2-7]{20,}$/);
    expect(setup.otpAuthUrl).toContain('otpauth://totp/');

    await useAuthStore.getState().confirmTotp('123456');
    expect(useAuthStore.getState().user?.mfaEnabled).toBe(true);
    expect(demoSeedUser()?.mfaEnabled).toBe(true);

    // Sign out, then sign in again — a challenge is raised instead of auth.
    await useAuthStore.getState().signOut();
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    const pending = useAuthStore.getState().pendingMfa;
    expect(pending).toEqual(
      expect.objectContaining({ email: 'demo@classicwatch.local', mode: 'totp' })
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Completing the challenge authenticates the user.
    await useAuthStore.getState().verifyMfaChallenge('654321');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().pendingMfa).toBeNull();
    expect(useAuthStore.getState().user?.email).toBe('demo@classicwatch.local');
  });

  it('rejects a malformed challenge code', async () => {
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    await useAuthStore.getState().enableTotp();
    await useAuthStore.getState().confirmTotp('123456');
    await useAuthStore.getState().signOut();
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');

    await expect(useAuthStore.getState().verifyMfaChallenge('12')).rejects.toThrow('6-digit code');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('registers a passkey and signs in with it instead of a code', async () => {
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');

    const record = await useAuthStore.getState().registerPasskey('MacBook Pro');
    expect(record.name).toBe('MacBook Pro');
    expect(useAuthStore.getState().user?.passkeys).toHaveLength(1);
    expect(demoSeedUser()?.passkeys).toHaveLength(1);

    await useAuthStore.getState().signOut();
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    expect(useAuthStore.getState().pendingMfa?.passkeyAvailable).toBe(true);

    await useAuthStore.getState().signInWithPasskey();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().pendingMfa).toBeNull();
  });

  it('disabling 2FA removes the challenge on the next sign-in', async () => {
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    await useAuthStore.getState().enableTotp();
    await useAuthStore.getState().confirmTotp('123456');

    await useAuthStore.getState().disableMfa();
    expect(useAuthStore.getState().user?.mfaEnabled).toBe(false);
    expect(demoSeedUser()?.mfaEnabled).toBe(false);

    await useAuthStore.getState().signOut();
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    expect(useAuthStore.getState().pendingMfa).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('persists 2FA and passkey state into the mock database', async () => {
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    await useAuthStore.getState().enableTotp();
    await useAuthStore.getState().confirmTotp('123456');
    await useAuthStore.getState().registerPasskey('iPhone');

    expect(demoSeedUser()?.mfaEnabled).toBe(true);
    expect(demoSeedUser()?.passkeys?.map((item) => item.name)).toEqual(['iPhone']);
    // Audit events are recorded for security-sensitive changes.
    const actions = demoSeedUser()?.history?.map((event) => event.action) ?? [];
    expect(actions).toContain('Two-factor authentication enabled');
    expect(actions).toContain('Passkey registered');
  });
});
