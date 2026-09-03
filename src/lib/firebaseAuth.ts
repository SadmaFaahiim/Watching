// Lazy accessor for the firebase/auth SDK. The auth store reads firebase/auth
// functions through this module instead of statically importing the SDK, so
// demo mode (no Firebase config) never loads or evaluates the ~240 KB SDK on
// the critical path.
type FirebaseAuthModule = typeof import('firebase/auth');

let sdk: FirebaseAuthModule | null = null;

export const loadFirebaseAuth = async (): Promise<FirebaseAuthModule> => {
  if (!sdk) {
    sdk = await import('firebase/auth');
  }
  return sdk;
};
