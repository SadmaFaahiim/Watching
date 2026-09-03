import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import config from '@/config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let initPromise: Promise<void> | null = null;
let warned = false;

export const isFirebaseConfigured = (): boolean =>
  Boolean(
    config.firebase.apiKey &&
    config.firebase.authDomain &&
    config.firebase.projectId &&
    config.firebase.appId
  );

/**
 * Lazy Firebase initializer. The SDK (auth/firestore/storage, ~240 KB) is only
 * fetched and evaluated when the app is actually configured for Firebase —
 * demo mode never imports it, keeping the critical JS graph lean. Safe to call
 * multiple times; concurrent callers share one init promise.
 */
export const initializeFirebase = (): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }
  if (!isFirebaseConfigured()) {
    if (!warned) {
      warned = true;
      // Dev-only hint — production demo builds stay silent so console-noise
      // audits (Lighthouse) don't flag a missing-credentials notice.
      if (import.meta.env.DEV) {
        console.warn(
          '[firebase] Missing VITE_FIREBASE_* environment variables. ' +
            'Copy .env.example to .env.local and fill in your Firebase project details.'
        );
      }
    }
    return Promise.resolve();
  }
  initPromise = (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }, { getStorage }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/storage'),
    ]);
    app = initializeApp(config.firebase);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  })();
  return initPromise;
};

export const getFirebaseAuth = (): Auth | undefined => auth;
export const getFirebaseDb = (): Firestore | undefined => db;
export const getFirebaseStorage = (): FirebaseStorage | undefined => storage;

export { app, auth, db, storage };
