/**
 * lib/firebase.ts
 * ---------------
 * Firebase client initialization with Google OAuth provider.
 * Supports environment variables with graceful fallback for local development.
 */

import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bizlens-auth.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizlens-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bizlens-demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

// Check if valid Firebase credentials are provided in env
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key' &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
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
