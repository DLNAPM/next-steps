import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInAsGuest: () => void;
  signInAsDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PREMIUM_EMAILS = [
  'dlaniger.napm.consulting@gmail.com',
  'reach_dlaniger@hotmail.com',
  'monnib30228@gmail.com'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // Handle redirect authentication response if returning from redirect flow
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            console.log("Redirect login successful:", result.user.email);
          }
        })
        .catch((err: any) => {
          console.warn("getRedirectResult result error/notice:", err);
          if (
            err?.code === 'auth/missing-initial-state' ||
            err?.message?.includes('missing initial state') ||
            err?.message?.includes('sessionStorage')
          ) {
            setAuthError(
              "Android / Storage Partitioning Notice: Mobile Chrome restricts cross-site session storage for Google redirects. Please use the Email & Password login below for guaranteed instant access."
            );
          }
        });

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Check if user exists in Firestore
            let userData: any = {};
            if (db) {
              const userRef = doc(db, 'users', firebaseUser.uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                userData = userSnap.data();
                
                // If frozen, we technically shouldn't let them do much, but we still log them in to show frozen state
                // Update last login
                await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
              } else {
                // Create user
                const isDlaniger = firebaseUser.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com';
                const isPremiumEmail = firebaseUser.email ? PREMIUM_EMAILS.includes(firebaseUser.email.toLowerCase()) : false;
                
                userData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
                  photoURL: firebaseUser.photoURL,
                  isPremium: isDlaniger || isPremiumEmail,
                  isAdmin: isDlaniger,
                  isFrozen: false,
                  createdAt: serverTimestamp(),
                  lastLoginAt: serverTimestamp()
                };
                await setDoc(userRef, userData);
              }

              // Force admin config for target user if accidentally revoked
              if (firebaseUser.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com') {
                userData.isAdmin = true;
                userData.isPremium = true;
              }
            } else {
               // Fallback if db isn't available
               userData = {
                 isPremium: firebaseUser.email ? PREMIUM_EMAILS.includes(firebaseUser.email.toLowerCase()) : false,
                 isAdmin: firebaseUser.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com',
                 isFrozen: false
               };
            }

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userData.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
              photoURL: firebaseUser.photoURL,
              isGuest: false,
              isPremium: userData.isPremium,
              isAdmin: userData.isAdmin,
              isFrozen: userData.isFrozen,
            });
            setAuthError(null);
          } catch (e) {
            console.error("Error fetching/setting user in firestore:", e);
            // Fallback
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
              photoURL: firebaseUser.photoURL,
              isGuest: false,
              isPremium: firebaseUser.email ? PREMIUM_EMAILS.includes(firebaseUser.email.toLowerCase()) : false,
              isAdmin: firebaseUser.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com',
            });
          }
        } else {
          // Only clear user if we weren't in guest or demo mode
          setUser((prev) => ((prev?.isGuest || prev?.isDemo) ? prev : null));
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
      setAuthError("Firebase is not configured. Please add your VITE_FIREBASE_* environment variables to use Google Login.");
      return;
    }
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';

      if (
        errorCode === 'auth/missing-initial-state' ||
        errorMessage.includes('missing initial state') ||
        errorMessage.includes('sessionStorage') ||
        errorCode === 'auth/web-storage-unsupported'
      ) {
        setAuthError(
          "Android / Mobile Browser Notice: Chrome on Android blocks cross-site session storage for Google popups. Please sign in using Email & Password below, or enable third-party cookies in Chrome Settings > Site Settings."
        );
      } else if (errorCode === 'auth/popup-blocked') {
        // Try redirect as fallback if popup was blocked
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr: any) {
          console.error("Redirect sign-in error:", redirErr);
          setAuthError("Popup was blocked by your browser. Please allow popups or use Email & Password below.");
        }
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setAuthError(null);
      } else if (errorCode === 'auth/unauthorized-domain') {
        setAuthError("This domain is not yet in Firebase Console > Authentication > Settings > Authorized domains. You can sign in with Email & Password below in the meantime.");
      } else {
        setAuthError(errorMessage || "Failed to sign in with Google. You can sign in with Email & Password below.");
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      setAuthError("Firebase is not configured.");
      throw new Error("Firebase is not configured.");
    }
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error("Error signing in with email:", error);
      const code = error?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError("Invalid email or password. Please check your credentials or create a new account.");
      } else if (code === 'auth/too-many-requests') {
        setAuthError("Too many failed attempts. Please reset your password or wait a moment.");
      } else if (code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError(error?.message || "Failed to sign in. Please verify your email and password.");
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured || !auth) {
      setAuthError("Firebase is not configured.");
      throw new Error("Firebase is not configured.");
    }
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      const code = error?.code || '';
      if (code === 'auth/email-already-in-use') {
        setAuthError("An account with this email already exists. Please sign in instead.");
      } else if (code === 'auth/weak-password') {
        setAuthError("Password must be at least 6 characters.");
      } else if (code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError(error?.message || "Failed to create account. Please try again.");
      }
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      setAuthError("Firebase is not configured.");
      throw new Error("Firebase is not configured.");
    }
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        setAuthError("No account found with this email address.");
      } else if (code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError(error?.message || "Failed to send password reset email.");
      }
      throw error;
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

  const signInAsDemo = () => {
    setUser({
      uid: 'demo-user',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null,
      isGuest: true, // It behaves like guest (no firebase save), but with pre-loaded data
      isDemo: true,
      isPremium: true,
    });
  };

  const logout = async () => {
    if (user?.isGuest || user?.isDemo) {
      setUser(null);
    } else if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authError,
      clearAuthError,
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      signInAsGuest, 
      signInAsDemo, 
      logout 
    }}>
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
