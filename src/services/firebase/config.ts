import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;

// Demo mode: skip Firebase initialization entirely when no real API key is present
export const isDemoMode = !apiKey || apiKey === 'demo-api-key';

export const app: FirebaseApp | null = isDemoMode
  ? null
  : initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    });

export const auth: Auth | null = isDemoMode ? null : getAuth(app!);
export const db: Firestore | null = isDemoMode ? null : getFirestore(app!);
export const analytics: Analytics | null =
  isDemoMode || typeof window === 'undefined' ? null : getAnalytics(app!);
