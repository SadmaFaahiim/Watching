// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the browser ceremony so options plumbing is testable without an
// authenticator. The server verifier is dynamically imported by the lib, so
// hoisting a module mock is enough for the conversion checks.
vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: vi.fn(),
  startAuthentication: vi.fn(),
}));

vi.mock('@simplewebauthn/server', () => ({
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

import {
  describeWebAuthnError,
  fromBase64Url,
  generateChallenge,
  toBase64Url,
  webauthnSupported,
  runPasskeyRegistration,
  verifyPasskeyAuthentication,
  getRpId,
  getExpectedOrigin,
} from '@/lib/webauthn';
import { startRegistration } from '@simplewebauthn/browser';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('base64url helpers', () => {
  it('round-trips arbitrary bytes without padding', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255, 128]);
    const encoded = toBase64Url(bytes);
    expect(encoded).not.toContain('=');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect([...fromBase64Url(encoded)]).toEqual([...bytes]);
  });

  it('matches a known vector (RFC 4648 test vectors)', () => {
    const bytes = new TextEncoder().encode('any carnal pleasure.');
    expect(toBase64Url(bytes)).toBe('YW55IGNhcm5hbCBwbGVhc3VyZS4');
  });
});

describe('generateChallenge', () => {
  it('produces a 43-character base64url challenge', () => {
    const challenge = generateChallenge();
    expect(challenge).toHaveLength(43);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(generateChallenge()).not.toBe(challenge);
  });
});

describe('webauthnSupported', () => {
  it('reports false without the Credential Management API (jsdom)', () => {
    expect(webauthnSupported()).toBe(false);
  });

  it('reports true when the platform API is present', () => {
    vi.stubGlobal(
      'PublicKeyCredential',
      class {
        static isUserVerifyingPlatformAuthenticatorAvailable = vi.fn(async () => true);
      }
    );
    expect(webauthnSupported()).toBe(true);
  });
});

describe('describeWebAuthnError', () => {
  it('maps cancelled ceremonies to a friendly message', () => {
    const error = new Error('The request is not allowed by the user agent or the platform');
    error.name = 'NotAllowedError';
    expect(describeWebAuthnError(error)).toContain('cancelled');
  });

  it('maps duplicate registrations to a clear message', () => {
    const error = new Error('already exists');
    error.name = 'InvalidStateError';
    expect(describeWebAuthnError(error)).toContain('already registered');
  });

  it('surfaces unknown errors verbatim', () => {
    expect(describeWebAuthnError(new Error('RP verification failed'))).toBe(
      'RP verification failed'
    );
  });
});

describe('runPasskeyRegistration', () => {
  it('passes the correct creation options to the ceremony', async () => {
    const fakeResponse = { id: 'cred-1', response: { clientDataJSON: 'x' } };
    vi.mocked(startRegistration).mockResolvedValue(fakeResponse as never);

    const result = await runPasskeyRegistration(
      {
        userName: 'demo@classicwatch.local',
        userDisplayName: 'Demo Admin',
        userId: 'demo-user',
        challenge: 'abc123',
      },
      ['existing-1']
    );

    expect(startRegistration).toHaveBeenCalledTimes(1);
    const options = vi.mocked(startRegistration).mock.calls[0][0].optionsJSON;
    expect(options.challenge).toBe('abc123');
    expect(options.rp).toEqual({ name: 'Classic Watch Pro', id: getRpId() });
    expect(options.user.name).toBe('demo@classicwatch.local');
    expect(options.user.id).toBeTruthy();
    expect(options.pubKeyCredParams.map((param) => param.alg)).toEqual([-7, -257, -8]);
    expect(options.excludeCredentials).toEqual([{ id: 'existing-1', type: 'public-key' }]);
    expect(result.id).toBe('cred-1');
  });
});

describe('verifyPasskeyAuthentication', () => {
  it('converts the stored base64url key to bytes and advances the counter', async () => {
    const publicKeyBytes = new Uint8Array([4, 5, 6, 7, 8]);
    vi.mocked(verifyAuthenticationResponse).mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 7, credentialID: 'cred-1' },
    } as never);

    const record = {
      id: 'cred-1',
      name: 'MacBook Pro',
      createdAt: new Date(),
      isWebAuthn: true,
      credential: {
        publicKey: toBase64Url(publicKeyBytes),
        publicKeyAlgorithm: -7,
        counter: 3,
        transports: ['internal'],
      },
    };

    await verifyPasskeyAuthentication({
      credential: record,
      response: { id: 'cred-1', response: {} } as never,
      challenge: 'chal',
    });

    expect(verifyAuthenticationResponse).toHaveBeenCalledTimes(1);
    const credentialArg = vi.mocked(verifyAuthenticationResponse).mock.calls[0][0].credential;
    expect([...credentialArg.publicKey]).toEqual([...publicKeyBytes]);
    expect(credentialArg.counter).toBe(3);
    // Counter advanced to the verifier's reported value.
    expect(record.credential?.counter).toBe(7);
  });

  it('throws when the verifier reports failure', async () => {
    vi.mocked(verifyAuthenticationResponse).mockResolvedValue({
      verified: false,
      authenticationInfo: { newCounter: 0, credentialID: 'cred-1' },
    } as never);

    const record = {
      id: 'cred-1',
      name: 'MacBook Pro',
      createdAt: new Date(),
      isWebAuthn: true,
      credential: {
        publicKey: toBase64Url(new Uint8Array([1])),
        publicKeyAlgorithm: -7,
        counter: 0,
      },
    };
    await expect(
      verifyPasskeyAuthentication({
        credential: record,
        response: { id: 'cred-1', response: {} } as never,
        challenge: 'chal',
      })
    ).rejects.toThrow('could not be verified');
  });
});

describe('rp identity', () => {
  it('derives the RP id and origin from the page', () => {
    expect(getRpId()).toBe(window.location.hostname);
    expect(getExpectedOrigin()).toBe(window.location.origin);
  });
});
