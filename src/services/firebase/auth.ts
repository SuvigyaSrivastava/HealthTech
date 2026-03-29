import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, isDemoMode } from './config';
import type { AuthUser, LoginCredentials } from '../../shared/types/patient.types';
import { DEMO_CREDENTIALS } from '../../shared/constants/routes';

// Demo mode: bypass Firebase if credentials match demo
const DEMO_USER: AuthUser = {
  uid: 'demo-uid-001',
  email: DEMO_CREDENTIALS.email,
  displayName: 'Dr. Sarah Johnson',
  photoURL: null,
  role: 'doctor' as const,
  permissions: ['read:patients', 'write:patients', 'read:analytics'],
  lastLogin: new Date(),
};

const mapFirebaseUser = (user: FirebaseUser): AuthUser => ({
  uid: user.uid,
  email: user.email ?? '',
  displayName: user.displayName,
  photoURL: user.photoURL,
  role: 'doctor',
  permissions: ['read:patients', 'write:patients', 'read:analytics'],
  lastLogin: new Date(),
});

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    // Demo mode: allow demo credentials without real Firebase
    if (
      credentials.email === DEMO_CREDENTIALS.email &&
      credentials.password === DEMO_CREDENTIALS.password
    ) {
      return DEMO_USER;
    }

    try {
      const { user } = await signInWithEmailAndPassword(
        auth!,
        credentials.email,
        credentials.password
      );
      return mapFirebaseUser(user);
    } catch (error) {
      throw error;
    }
  },

  async logout(): Promise<void> {
    if (isDemoMode) return;
    try {
      await signOut(auth!);
    } catch {
      // ignore if not signed in via Firebase
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (isDemoMode) {
      // In demo mode, never restore auth from Firebase — always start unauthenticated
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth!, (user) => {
      if (user) {
        callback(mapFirebaseUser(user));
      } else {
        callback(null);
      }
    });
  },

  getDemoUser(): AuthUser {
    return DEMO_USER;
  },

  async loginWithGoogle(): Promise<AuthUser> {
    if (isDemoMode) {
      return DEMO_USER;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user } = await signInWithPopup(auth!, provider);
    return mapFirebaseUser(user);
  },
};
