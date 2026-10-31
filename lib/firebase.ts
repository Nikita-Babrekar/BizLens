/**
 * lib/firebase.ts
 * ---------------
 * Firebase client initialization with Google OAuth provider.
 * Bundles verified project identifiers with environment variable overrides.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAlHQsJMfvXFzs6AZP6WiddPVIeGOuM74g',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bizlens-983ae.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizlens-983ae',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bizlens-983ae.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '83361302981',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:83361302981:web:3426f0dc38b4a4c24563ac',
};

// Check if valid Firebase credentials are provided in env or defaults
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'demo-api-key' &&
  firebaseConfig.projectId
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Configure Google OAuth provider to force the account selection screen
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  if (typeof window !== 'undefined' && auth) {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }
} catch (error) {
  // Graceful fallback for non-browser / mock environment
  try {
    app = initializeApp(firebaseConfig, 'bizlens-fallback');
    auth = getAuth(app);
  } catch {
    // Ignore fallback errors
  }
}

export { app, auth, googleProvider };
