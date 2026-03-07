import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isGuest: false,
          });
        } else {
          // Only clear user if we weren't in guest mode (or if we want to force logout)
          // Actually, onAuthStateChanged fires on init. If no user, we might be guest or not logged in.
          // We'll let the local state persist if it's guest, but if firebase explicitly says "no user" 
          // and we thought we were a firebase user, we log out.
          setUser((prev) => (prev?.isGuest ? prev : null));
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      alert("Firebase is not configured. Please add your VITE_FIREBASE_* environment variables to use Google Login.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Failed to sign in with Google. See console for details.");
    }
  };

  const signInAsGuest = () => {
    setUser({
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      email: 'guest@example.com',
      displayName: 'Guest User',
      photoURL: null,
      isGuest: true,
    });
  };

  const logout = async () => {
    if (user?.isGuest) {
      setUser(null);
    } else if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
