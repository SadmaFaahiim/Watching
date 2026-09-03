import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import config from '@/config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let warned = false;

export const isFirebaseConfigured = (): boolean =>
  Boolean(
    config.firebase.apiKey &&
    config.firebase.authDomain &&
    config.firebase.projectId &&
    config.firebase.appId
  );

export const initializeFirebase = (): void => {
  if (app) {
    return;
  }
  if (!isFirebaseConfigured()) {
    if (!warned) {
      warned = true;
      console.warn(
        '[firebase] Missing VITE_FIREBASE_* environment variables. ' +
          'Copy .env.example to .env.local and fill in your Firebase project details.'
      );
    }
    return;
  }
  app = initializeApp(config.firebase);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
};

export const getFirebaseAuth = (): Auth | undefined => {
  if (!auth && isFirebaseConfigured()) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseDb = (): Firestore | undefined => {
  if (!db && isFirebaseConfigured()) {
    initializeFirebase();
  }
  return db;
};

export const getFirebaseStorage = (): FirebaseStorage | undefined => {
  if (!storage && isFirebaseConfigured()) {
    initializeFirebase();
  }
  return storage;
};

export { app, auth, db, storage };
