'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { syncUserToBackend } from '@/lib/api';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  shopName: string;
  setShopName: (name: string) => void;
  isOnboarded: boolean;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (show: boolean) => void;
  signInWithGoogle: (forceDemo?: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
  completeOnboarding: (chosenShopName: string) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_SHOP_KEY = 'bizlens_shop_name';
const STORAGE_DEMO_USER_KEY = 'bizlens_demo_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [shopName, setShopNameState] = useState<string>('My Coffee Shop');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load shop name for a given user ID
  const loadUserShopName = useCallback((uid: string) => {
    try {
      const userSpecificShop = localStorage.getItem(`${STORAGE_SHOP_KEY}_${uid}`);
      const generalShop = localStorage.getItem(STORAGE_SHOP_KEY);
      const savedName = userSpecificShop || generalShop;

      if (savedName && savedName.trim() && savedName.trim() !== 'My Coffee Shop') {
        setShopNameState(savedName.trim());
        setIsOnboarded(true);
        setShowOnboardingModal(false);
      } else {
        // Needs shop onboarding
        setShopNameState('My Coffee Shop');
        setIsOnboarded(false);
        setShowOnboardingModal(true);
      }
    } catch {
      // Storage unavailable
      setIsOnboarded(false);
      setShowOnboardingModal(true);
    }
  }, []);

  // Set shop name both in state and storage
  const setShopName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShopNameState(trimmed);
    try {
      localStorage.setItem(STORAGE_SHOP_KEY, trimmed);
      if (user?.uid) {
        localStorage.setItem(`${STORAGE_SHOP_KEY}_${user.uid}`, trimmed);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user?.uid]);

  // Complete onboarding workflow
  const completeOnboarding = useCallback((chosenShopName: string) => {
    const trimmed = chosenShopName.trim();
    if (!trimmed) return;
    setShopName(trimmed);
    setIsOnboarded(true);
    setShowOnboardingModal(false);
  }, [setShopName]);

  // Initialize auth listener - unauthenticated users stay null and see the Sign-In page
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      try {
        const savedDemo = localStorage.getItem(STORAGE_DEMO_USER_KEY);
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo) as AuthUser;
          setUser(parsed);
          loadUserShopName(parsed.uid);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const mappedUser: AuthUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        };
        setUser(mappedUser);
        loadUserShopName(mappedUser.uid);
        // Persist/Sync user to FastAPI SQLite database
        syncUserToBackend({
          id: mappedUser.uid,
          google_uid: mappedUser.uid,
          name: mappedUser.displayName,
          email: mappedUser.email,
        });
      } else {
        setUser(null);
        setIsOnboarded(false);
        setShowOnboardingModal(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserShopName]);

  // Sign in with Google (prompt: 'select_account' forces the account chooser screen)
  const signInWithGoogle = useCallback(async (forceDemo = false) => {
    setLoading(true);
    setAuthError(null);

    // Create provider instance and set prompt: 'select_account'
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    // If Firebase credentials are configured in .env.local and forceDemo is not requested, use standard Firebase Google OAuth
    if (!forceDemo && isFirebaseConfigured && auth) {
      try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const mappedUser: AuthUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        };
        setUser(mappedUser);
        loadUserShopName(mappedUser.uid);
        // Persist/Sync user to FastAPI SQLite database
        syncUserToBackend({
          id: mappedUser.uid,
          google_uid: mappedUser.uid,
          name: mappedUser.displayName,
          email: mappedUser.email,
        });
        return;
      } catch (err: any) {
        console.error('Firebase Google Auth error:', err);
        // Handle cancelled or closed popup gracefully without error banner
        if (
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request'
        ) {
          setLoading(false);
          return;
        }

        if (err.code === 'auth/unauthorized-domain') {
          setAuthError(
            'Domain not authorized in Firebase. In Firebase Console, go to Authentication > Settings > Authorized Domains and ensure "localhost" is listed.'
          );
          setLoading(false);
          return;
        }

        if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
          setAuthError(
            'Firebase API key in .env.local is not valid. You can provide your active Firebase Web API key or click below to continue with Test Google Account.'
          );
          setLoading(false);
          return;
        }

        setAuthError(err.message || 'Failed to sign in with Google. Please try again.');
        setLoading(false);
        return;
      }
    }

    // High-fidelity fallback for local testing without active Firebase credentials
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const fallbackUser: AuthUser = {
        uid: 'google-user-' + Math.random().toString(36).substring(2, 9),
        displayName: 'Jordan Mitchell',
        email: 'jordan.mitchell@bizlens.ai',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      setUser(fallbackUser);
      loadUserShopName(fallbackUser.uid);
      // Persist/Sync user to FastAPI SQLite database
      syncUserToBackend({
        id: fallbackUser.uid,
        google_uid: fallbackUser.uid,
        name: fallbackUser.displayName,
        email: fallbackUser.email,
      });
    } catch {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadUserShopName]);

  // Sign out user & completely clear local storage and session state
  const signOutUser = useCallback(async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('Firebase signout error:', err);
    } finally {
      const currentUid = user?.uid;
      setUser(null);
      setIsOnboarded(false);
      setShowOnboardingModal(false);
      setShopNameState('My Coffee Shop');
      setAuthError(null);
      try {
        localStorage.removeItem(STORAGE_DEMO_USER_KEY);
        localStorage.removeItem(STORAGE_SHOP_KEY);
        if (currentUid) {
          localStorage.removeItem(`${STORAGE_SHOP_KEY}_${currentUid}`);
        }
        // Completely wipe any bizlens keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('bizlens_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch {
        // ignore
      }
      setLoading(false);
    }
  }, [user?.uid]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        shopName,
        setShopName,
        isOnboarded,
        showOnboardingModal,
        setShowOnboardingModal,
        signInWithGoogle,
        signOutUser,
        completeOnboarding,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
