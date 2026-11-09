/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
} from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] =
    useState(null);

  const [role, setRole] =
    useState(null);

  const [loading, setLoading] =
    useState(Boolean(auth));

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    console.log(
      '[AUTH] Starting Firebase auth listener.'
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          console.log(
            '[AUTH] Auth state changed:',
            user?.uid || 'No user'
          );

          /*
           * IMPORTANT:
           *
           * Set the Firebase user immediately.
           *
           * Do not wait for the admin-role Firestore
           * check before updating currentUser.
           *
           * This prevents a successful login from
           * temporarily looking like a logged-out user.
           */
          setCurrentUser(user);

          /*
           * No authenticated user.
           */
          if (!user) {
            setRole(null);
            setLoading(false);

            console.log(
              '[AUTH] No authenticated user.'
            );

            return;
          }

          /*
           * Keep the application in loading state while
           * we determine whether this user is an admin.
           */
          setLoading(true);

          let detectedRole = 'student';

          if (db) {
            try {
              console.log(
                '[AUTH] Checking admin role for:',
                user.uid
              );

              const adminDoc =
                await getDoc(
                  doc(
                    db,
                    'admins',
                    user.uid
                  )
                );

              if (adminDoc.exists()) {
                detectedRole = 'admin';

                console.log(
                  '[AUTH] Admin account detected.'
                );
              } else {
                console.log(
                  '[AUTH] Student account detected.'
                );
              }
            } catch (roleError) {
              /*
               * If the admin check fails, default to
               * student instead of treating the user
               * as logged out.
               */
              console.error(
                '[AUTH] Error checking user role:',
                roleError
              );

              detectedRole = 'student';
            }
          }

          setRole(detectedRole);

          /*
           * Authentication + role detection are now
           * ready for protected routes.
           */
          setLoading(false);

          console.log(
            '[AUTH] Authentication ready:',
            {
              uid: user.uid,
              role: detectedRole,
            }
          );
        }
      );

    return () => {
      console.log(
        '[AUTH] Removing Firebase auth listener.'
      );

      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      role,
      loading,

      /*
       * These setters are intentionally exposed because
       * LoginPage can immediately synchronize the context
       * after Firebase sign-in succeeds.
       */
      setCurrentUser,
      setRole,
    }),
    [
      currentUser,
      role,
      loading,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider.'
    );
  }

  return context;
}