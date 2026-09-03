import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import type { PasskeyRecord } from '@/types';

// ---------------------------------------------------------------------------
// WebAuthn ceremonies for the demo relying party.
//
// In demo mode the browser acts as both authenticator and (mock) server, so
// registration and authentication run genuine WebAuthn ceremonies through
// @simplewebauthn/browser and are then *cryptographically verified* client-side
// with @simplewebauthn/server. When the platform lacks WebAuthn (insecure
// context, old browser) callers fall back to the legacy name-only stand-in.
// ---------------------------------------------------------------------------

export const RP_NAME = 'Classic Watch Pro';

/** The effective RP ID is the page's hostname (localhost in dev). */
export const getRpId = (): string =>
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const getExpectedOrigin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

/**
 * WebAuthn needs a secure context (HTTPS or localhost) plus the Credential
 * Management API. On other origins the demo falls back to the stand-in.
 */
export const webauthnSupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.PublicKeyCredential !== 'undefined' &&
  typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

// --- base64url helpers (standard browser-safe alphabet) --------------------

export const toBase64Url = (value: ArrayBuffer | Uint8Array): string => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const normalized = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/** 32 random bytes, base64url — the challenge is never reused. */
export const generateChallenge = (): string => {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return toBase64Url(bytes);
};

const stringToBytes = (value: string): Uint8Array => new TextEncoder().encode(value);

/** Maps a friendly error from a failed ceremony to a safe user message. */
export const describeWebAuthnError = (error: unknown): string => {
  if (error instanceof Error) {
    const { name, message } = error;
    if (name === 'NotAllowedError' || name === 'AbortError') {
      return 'The passkey request was cancelled. Please try again.';
    }
    if (name === 'InvalidStateError') {
      return 'This device is already registered as a passkey.';
    }
    if (name === 'NotSupportedError') {
      return 'This device or browser does not support passkeys.';
    }
    if (message && !message.includes('cancelled')) return message;
  }
  return 'Passkey registration failed. Please try again.';
};

// --- Registration ceremony ---------------------------------------------------

export interface PasskeyRegistrationResult {
  id: string;
  response: RegistrationResponseJSON;
}

export const runPasskeyRegistration = async (
  options: { userName: string; userDisplayName: string; userId: string; challenge: string },
  existingCredentialIds: string[]
): Promise<PasskeyRegistrationResult> => {
  const creationOptions: PublicKeyCredentialCreationOptionsJSON = {
    rp: { name: RP_NAME, id: getRpId() },
    user: {
      id: toBase64Url(stringToBytes(options.userId)),
      name: options.userName,
      displayName: options.userDisplayName,
    },
    challenge: options.challenge,
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
      { type: 'public-key', alg: -8 }, // EdDSA
    ],
    timeout: 60_000,
    attestation: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: existingCredentialIds.map((id) => ({ id, type: 'public-key' })),
  };
  const response = await startRegistration({ optionsJSON: creationOptions });
  return { id: response.id, response };
};

/**
 * Verifies a registration response against the challenge we issued. In a real
 * deployment this runs on the server; the demo RP runs it client-side so the
 * credential material stored is proven genuine.
 */
export const verifyPasskeyRegistration = async (input: {
  response: RegistrationResponseJSON;
  challenge: string;
}): Promise<{
  publicKey: string;
  publicKeyAlgorithm: number;
  counter: number;
  aaguid?: string;
}> => {
  // @simplewebauthn/server is heavy (ASN.1/CBOR machinery) and only needed when
  // a real ceremony runs, so it loads on demand rather than in the app shell.
  const { verifyRegistrationResponse } = await import('@simplewebauthn/server');
  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge: input.challenge,
    expectedOrigin: getExpectedOrigin(),
    expectedRPID: getRpId(),
  });
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('The passkey registration could not be verified.');
  }
  const { registrationInfo: info } = verification;
  return {
    // Stored base64url (JSON-safe); converted back to bytes when verifying.
    publicKey: toBase64Url(info.credential.publicKey),
    publicKeyAlgorithm: input.response.response.publicKeyAlgorithm ?? -7,
    counter: info.credential.counter,
    aaguid: info.aaguid,
  };
};

// --- Authentication ceremony -------------------------------------------------

export const runPasskeyAuthentication = async (options: {
  challenge: string;
  allowCredentials: { id: string; transports?: string[] }[];
}): Promise<AuthenticationResponseJSON> => {
  const requestOptions: PublicKeyCredentialRequestOptionsJSON = {
    challenge: options.challenge,
    rpId: getRpId(),
    timeout: 60_000,
    userVerification: 'preferred',
    allowCredentials: options.allowCredentials.map((credential) => ({
      id: credential.id,
      type: 'public-key',
      transports: credential.transports as PublicKeyCredentialDescriptor['transports'],
    })),
  };
  return startAuthentication({ optionsJSON: requestOptions });
};

/** Verifies an assertion signature against the stored public key. */
export const verifyPasskeyAuthentication = async (input: {
  credential: PasskeyRecord;
  response: AuthenticationResponseJSON;
  challenge: string;
}): Promise<void> => {
  if (!input.credential.credential) {
    throw new Error('This passkey has no credential material to verify.');
  }
  // Loaded on demand like the registration verifier — keeps the heavy crypto
  // machinery out of the app shell.
  const { verifyAuthenticationResponse } = await import('@simplewebauthn/server');
  const verification = await verifyAuthenticationResponse({
    response: input.response,
    expectedChallenge: input.challenge,
    expectedOrigin: getExpectedOrigin(),
    expectedRPID: getRpId(),
    credential: {
      id: input.credential.id,
      publicKey: fromBase64Url(input.credential.credential.publicKey),
      counter: input.credential.credential.counter,
      transports: input.credential.credential.transports as AuthenticatorTransport[],
    },
  });
  if (!verification.verified) {
    throw new Error('The passkey assertion could not be verified.');
  }
  // Record the latest counter so replayable old assertions fail.
  input.credential.credential.counter = verification.authenticationInfo.newCounter;
};

/** Converts a stored record into the allowCredentials list for authentication. */
export const toAllowCredentials = (passkeys: PasskeyRecord[]) =>
  passkeys
    .filter((record) => record.isWebAuthn && record.credential)
    .map((record) => ({
      id: record.id,
      transports: record.credential?.transports,
    }));