import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const mocks = vi.hoisted(() => ({
  webauthnSupported: vi.fn(() => true),
  runPasskeyRegistration: vi.fn(),
  verifyPasskeyRegistration: vi.fn(),
  runPasskeyAuthentication: vi.fn(),
  verifyPasskeyAuthentication: vi.fn(),
  generateChallenge: vi.fn(() => 'mock-challenge'),
}));

vi.mock('@/lib/webauthn', () => ({
  webauthnSupported: mocks.webauthnSupported,
  runPasskeyRegistration: mocks.runPasskeyRegistration,
  verifyPasskeyRegistration: mocks.verifyPasskeyRegistration,
  runPasskeyAuthentication: mocks.runPasskeyAuthentication,
  verifyPasskeyAuthentication: mocks.verifyPasskeyAuthentication,
  generateChallenge: mocks.generateChallenge,
  describeWebAuthnError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unknown error',
  toAllowCredentials: (
    passkeys: { id: string; isWebAuthn?: boolean; credential?: { transports?: string[] } }[]
  ) =>
    passkeys
      .filter((record) => record.isWebAuthn && record.credential)
      .map((record) => ({ id: record.id, transports: record.credential?.transports })),
}));

import { useAuthStore } from '@/store/auth.store';
import { seedUsers } from '@/mocks/data';
import { getDemoUser } from '@/mocks/auth';

const demoSeedUser = () => seedUsers.find((user) => user.id === 'demo-user');

const resetSeedAccount = () => {
  const account = demoSeedUser();
  if (account) {
    account.mfaEnabled = false;
    account.mfaEnrolledAt = undefined;
    account.passkeys = [];
  }
};

describe('auth store — real WebAuthn ceremonies', () => {
  beforeEach(() => {
    resetSeedAccount();
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      pendingMfa: null,
    });
  });

  it('registers a genuine WebAuthn passkey with verified credential material', async () => {
    mocks.runPasskeyRegistration.mockResolvedValue({
      id: 'cred-real-1',
      response: {
        id: 'cred-real-1',
        rawId: 'cred-real-1',
        type: 'public-key',
        response: {
          clientDataJSON: 'cd',
          attestationObject: 'ao',
          authenticatorData: 'ad',
          publicKey: 'pk',
          publicKeyAlgorithm: -7,
          transports: ['internal', 'hybrid'],
        },
      },
    });
    mocks.verifyPasskeyRegistration.mockResolvedValue({
      publicKey: 'cose-pk-b64',
      publicKeyAlgorithm: -7,
      counter: 0,
      aaguid: 'aaguid-1',
    });

    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    const record = await useAuthStore.getState().registerPasskey('Work Mac');

    expect(mocks.runPasskeyRegistration).toHaveBeenCalledTimes(1);
    expect(mocks.verifyPasskeyRegistration).toHaveBeenCalledTimes(1);
    expect(record).toMatchObject({
      id: 'cred-real-1',
      name: 'Work Mac',
      isWebAuthn: true,
      credential: {
        publicKey: 'cose-pk-b64',
        publicKeyAlgorithm: -7,
        counter: 0,
        transports: ['internal', 'hybrid'],
        aaguid: 'aaguid-1',
      },
    });
    // The seed record and the store copy agree.
    expect(demoSeedUser()?.passkeys?.[0]?.id).toBe('cred-real-1');
    expect(useAuthStore.getState().user?.passkeys?.[0]?.isWebAuthn).toBe(true);
  });

  it('signs in with a verified WebAuthn assertion and advances the counter', async () => {
    const seed = demoSeedUser();
    if (!seed) throw new Error('seed missing');
    seed.passkeys = [
      {
        id: 'cred-real-1',
        name: 'Work Mac',
        createdAt: new Date(),
        isWebAuthn: true,
        credential: {
          publicKey: 'cose-pk-b64',
          publicKeyAlgorithm: -7,
          counter: 3,
          transports: ['internal'],
        },
      },
    ];

    mocks.runPasskeyAuthentication.mockResolvedValue({
      id: 'cred-real-1',
      response: {},
    });
    // The verifier advances the counter it is given.
    mocks.verifyPasskeyAuthentication.mockImplementation(
      async (input: { credential: { credential?: { counter: number } } }) => {
        if (input.credential.credential) input.credential.credential.counter = 8;
      }
    );

    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    expect(useAuthStore.getState().pendingMfa?.passkeyAvailable).toBe(true);

    await useAuthStore.getState().signInWithPasskey();

    expect(mocks.runPasskeyAuthentication).toHaveBeenCalledWith({
      challenge: 'mock-challenge',
      allowCredentials: [{ id: 'cred-real-1', transports: ['internal'] }],
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().pendingMfa).toBeNull();
    // Counter persisted to the seed record.
    expect(demoSeedUser()?.passkeys?.[0]?.credential?.counter).toBe(8);
  });

  it('rejects an assertion from an unregistered credential', async () => {
    const seed = demoSeedUser();
    if (!seed) throw new Error('seed missing');
    seed.passkeys = [
      {
        id: 'cred-real-1',
        name: 'Work Mac',
        createdAt: new Date(),
        isWebAuthn: true,
        credential: { publicKey: 'pk', publicKeyAlgorithm: -7, counter: 0 },
      },
    ];

    mocks.runPasskeyAuthentication.mockResolvedValue({ id: 'cred-evil', response: {} });

    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    await expect(useAuthStore.getState().signInWithPasskey()).rejects.toThrow(/not registered/);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('falls back to the stand-in when the platform lacks WebAuthn', async () => {
    mocks.webauthnSupported.mockReturnValue(false);

    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    const record = await useAuthStore.getState().registerPasskey('Old Phone');

    expect(mocks.runPasskeyRegistration).not.toHaveBeenCalled();
    expect(record.isWebAuthn).toBeUndefined();
    expect(demoSeedUser()?.passkeys?.[0]?.id).toMatch(/^pk-/);

    await useAuthStore.getState().signOut();
    await useAuthStore.getState().signIn('demo@classicwatch.local', 'password123');
    await useAuthStore.getState().signInWithPasskey();
    // Stand-in path still authenticates.
    expect(getDemoUser('demo-user')?.passkeys?.[0]?.id).toMatch(/^pk-/);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
