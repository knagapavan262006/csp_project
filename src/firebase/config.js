import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const getFirebaseErrorMessage = (error) => {
  if (!error || !error.message) return 'Something went wrong with Firebase.';

  if (error.code === 'auth/invalid-credential') return 'Invalid login details.';
  if (error.code === 'auth/user-not-found') return 'Account not found.';
  if (error.code === 'auth/wrong-password') return 'Incorrect password.';
  if (error.code === 'auth/email-already-in-use') return 'This email is already registered.';
  if (error.code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
  if (error.code === 'permission-denied') return 'You do not have permission to access this data.';

  return error.message;
};
