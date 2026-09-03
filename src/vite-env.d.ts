/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module 'firebase/app' {
  export function initializeApp(config: object, name?: string): any;
  export function getApp(name?: string): any;
  export function getApps(): any[];
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export function connectAuthEmulator(auth: any, url: string): void;
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function signOut(auth: any): Promise<void>;
  export function sendPasswordResetEmail(auth: any, email: string): Promise<void>;
  export function sendEmailVerification(auth: any, user: any): Promise<void>;
  export function onAuthStateChanged(auth: any, callback: (user: any) => void): () => void;
  export function updateProfile(user: any, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  export function reauthenticateWithCredential(user: any, credential: any): Promise<any>;
  export const EmailAuthProvider: any;
  export const GoogleAuthProvider: any;
  export const OAuthProvider: any;
  export function getRedirectResult(auth: any): Promise<any>;
  export function signInWithRedirect(auth: any, provider: any): Promise<void>;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export function multiFactor(user: any): any;
  export const PhoneAuthProvider: any;
  export const TotpSecret: any;
  export const TotpMultiFactorGenerator: any;
  export const MultiFactorResolver: any;
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    metadata: { creationTime?: string };
  }
}

declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function connectFirestoreEmulator(db: any, host: string, port: number): void;
  export function collection(db: any, path: string): any;
  export function doc(db: any, path: string): any;
  export function getDoc(docRef: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function setDoc(docRef: any, data: any, options?: any): Promise<void>;
  export function updateDoc(docRef: any, data: any): Promise<void>;
  export function deleteDoc(docRef: any): Promise<void>;
  export function query(...args: any[]): any;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function orderBy(fieldPath: string, direction?: string): any;
  export function limit(limit: number): any;
  export function startAfter(docSnapshot: any): any;
  export function onSnapshot(docRef: any, callback: (snapshot: any) => void): () => void;
  export function writeBatch(db: any): any;
  export function runTransaction(db: any, updateFunction: (transaction: any) => Promise<any>): Promise<any>;
  export const Timestamp: any;
  export const FieldValue: any;
  export function serverTimestamp(): any;
  export function arrayUnion(...elements: any[]): any;
  export function arrayRemove(...elements: any[]): any;
  export function increment(n: number): any;
}

declare module 'firebase/storage' {
  export function getStorage(app?: any, bucket?: string): any;
  export function ref(storage: any, path: string): any;
  export function uploadBytes(res: any, data: any): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
  export function deleteObject(ref: any): Promise<void>;
}