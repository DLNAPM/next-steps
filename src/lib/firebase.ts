import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  indexedDBLocalPersistence, 
  browserLocalPersistence, 
  browserPopupRedirectResolver, 
  GoogleAuthProvider 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// These should be set in your environment variables
const env = (import.meta as any).env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
// We only initialize if we have config, otherwise we'll handle it gracefully for Guest mode
const app = (firebaseConfig.apiKey && !getApps().length) 
  ? initializeApp(firebaseConfig) 
  : (getApps().length ? getApp() : null);

// Initialize Auth with IndexedDB persistence first (resilient to Android tab unloading & session partition)
let initializedAuth = null;
if (app) {
  try {
    if (typeof window !== 'undefined') {
      initializedAuth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    } else {
      initializedAuth = getAuth(app);
    }
  } catch (_e) {
    // If auth was already initialized by Firebase internally, fallback to getAuth
    try {
      initializedAuth = getAuth(app);
    } catch (_err) {
      console.warn("Could not retrieve initialized Firebase Auth instance");
    }
  }
}

export const auth = initializedAuth;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const isFirebaseConfigured = !!app;
