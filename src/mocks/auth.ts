import type { PasskeyRecord, User } from '@/types';
import { demoUser, demoUserId } from '@/config';
import { appendEvent, persistMockDb, seedUsers } from '@/mocks/data';

// Demo-mode authentication helpers. When no Firebase credentials are
// configured, sign-in / registration is simulated against the in-memory
// user directory so every page can be exercised end to end.

const SESSION_KEY = 'cwp-demo-session';

// Deep enough that store state never aliases mutable seed arrays: immer
// autoFreezes whatever lands in the store, which would otherwise freeze the
// shared history/passkey arrays and break later mutations.
const cloneUser = (user: User): User => ({
  ...user,
  createdAt: new Date(user.createdAt),
  updatedAt: new Date(user.updatedAt),
  mfaEnrolledAt: user.mfaEnrolledAt ? new Date(user.mfaEnrolledAt) : undefined,
  history: user.history?.map((event) => ({ ...event, at: new Date(event.at) })),
  passkeys: user.passkeys?.map((record) => ({ ...record, createdAt: new Date(record.createdAt) })),
});

export const getDemoSessionUserId = (): string | null => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

export const setDemoSession = (userId: string): void => {
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {
    // Non-fatal — the session just will not survive a reload.
  }
};

export const clearDemoSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore.
  }
};

export const getDemoUser = (userId?: string | null): User | null => {
  if (userId === demoUserId) {
    // Prefer the live seed record so persisted 2FA/passkey state is respected.
    return cloneUser(seedUsers.find((user) => user.id === demoUserId) ?? demoUser);
  }
  const match = seedUsers.find((user) => user.id === userId);
  return match ? cloneUser(match) : null;
};

export const demoAuthenticate = async (email: string, password: string): Promise<User> => {
  // Simulate network latency so loading states are exercised.
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });  const normalized = email.trim().toLowerCase();

  if (normalized === demoUser.email.toLowerCase()) {
    if (!password || password.length < 4) {
      throw new Error('Invalid credentials. Hint: demo mode accepts any password of 4+ characters.');
    }
    setDemoSession(demoUserId);
    // Live seed record (not the static constant) so 2FA/passkey state applies.
    return cloneUser(seedUsers.find((user) => user.id === demoUserId) ?? demoUser);
  }

  const account = seedUsers.find((user) => user.email.toLowerCase() === normalized);
  if (!account) {
    throw new Error(
      'No account found for this email. In demo mode you can sign in with demo@classicwatch.local, or register a new account.'
    );
  }
  // Any password works for seeded demo accounts.
  setDemoSession(account.id);
  return cloneUser(account);
};

export const demoRegister = async (email: string, displayName: string): Promise<User> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });

  const normalized = email.trim().toLowerCase();
  const existing =
    seedUsers.find((user) => user.email.toLowerCase() === normalized) ||
    (normalized === demoUser.email.toLowerCase() ? demoUser : undefined);
  if (existing) {
    throw new Error('An account with this email already exists. Try signing in instead.');
  }

  const now = new Date();
  const id = `user-${seedUsers.length + 1}`;
  const user: User = {
    id,
    email: normalized,
    displayName: displayName.trim() || normalized.split('@')[0],
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    passkeys: [],
    createdAt: now,
    updatedAt: now,
  };
  seedUsers.push(user);
  setDemoSession(id);
  persistMockDb();
  return cloneUser(user);
};

export const demoGoogleSignIn = async (): Promise<User> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
  setDemoSession(demoUserId);
  return cloneUser(seedUsers.find((user) => user.id === demoUserId) ?? demoUser);
};

// ---------------------------------------------------------------------------
// Two-factor authentication / passkeys (demo path)
// ---------------------------------------------------------------------------

const seedUserById = (userId: string): User => {
  const user = seedUsers.find((item) => item.id === userId);
  if (!user) throw new Error('Account not found.');
  return user;
};

const randomSecret = (): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(new Uint8Array(20)))
      : Array.from({ length: 20 }, () => Math.floor(Math.random() * 256));
  return bytes.map((byte) => alphabet[byte % alphabet.length]).join('');
};

/** Step 1 of enrollment: generate a TOTP secret. Enrollment completes on confirm. */
export const demoEnableTotp = (userId: string): { secret: string; otpAuthUrl: string } => {
  const user = seedUserById(userId);
  if (user.mfaEnabled) throw new Error('Two-factor authentication is already enabled.');
  const secret = randomSecret();
  const otpAuthUrl =
    `otpauth://totp/Classic%20Watch%20Pro:${encodeURIComponent(user.email)}` +
    `?secret=${secret}&issuer=Classic%20Watch%20Pro&algorithm=SHA1&digits=6&period=30`;
  return { secret, otpAuthUrl };
};

/** Step 2 of enrollment: accept any 6-digit code (no real TOTP clock in demo). */
export const demoConfirmTotp = (userId: string, code: string): void => {
  if (!/^\d{6}$/.test(code.trim())) {
    throw new Error('Enter the 6-digit code from your authenticator app.');
  }
  const user = seedUserById(userId);
  user.mfaEnabled = true;
  user.mfaEnrolledAt = new Date();
  appendEvent(user, user.displayName || 'User', 'Two-factor authentication enabled');
  user.updatedAt = new Date();
  persistMockDb();
};

export const demoDisableMfa = (userId: string): void => {
  const user = seedUserById(userId);
  if (!user.mfaEnabled) return;
  user.mfaEnabled = false;
  user.mfaEnrolledAt = undefined;
  appendEvent(user, user.displayName || 'User', 'Two-factor authentication disabled');
  user.updatedAt = new Date();
  persistMockDb();
};

/**
 * Registers a passkey. Records carrying `credential` are genuine WebAuthn
 * credentials (credential id + COSE public key); records without one are the
 * legacy name-only stand-in used when the platform lacks the WebAuthn API.
 */
export const demoRegisterPasskey = (userId: string, record: PasskeyRecord): PasskeyRecord => {
  const user = seedUserById(userId);
  user.passkeys = [...(user.passkeys ?? []), { ...record }];
  appendEvent(
    user,
    record.name,
    'Passkey registered',
    `Device: ${record.name}${record.isWebAuthn ? ' (WebAuthn)' : ''}`
  );
  user.updatedAt = new Date();
  persistMockDb();
  return record;
};

/** Advances the signature counter after a verified WebAuthn assertion. */
export const demoUpdatePasskeyCounter = (userId: string, passkeyId: string, counter: number): void => {
  const user = seedUserById(userId);
  const record = user.passkeys?.find((item) => item.id === passkeyId);
  if (record?.credential) {
    record.credential.counter = counter;
    user.updatedAt = new Date();
    persistMockDb();
  }
};

export const demoRemovePasskey = (userId: string, passkeyId: string): void => {
  const user = seedUserById(userId);
  user.passkeys = (user.passkeys ?? []).filter((item) => item.id !== passkeyId);
  user.updatedAt = new Date();
  persistMockDb();
};

/**
 * Simulates the platform WebAuthn assertion for a passkey registered through
 * the legacy stand-in (no credential material to verify).
 */
export const demoSignInWithPasskey = async (userId: string): Promise<User> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
  const user = seedUserById(userId);
  if (!user.passkeys || user.passkeys.length === 0) {
    throw new Error('No passkey is registered for this account.');
  }
  setDemoSession(user.id);
  return cloneUser(user);
};
