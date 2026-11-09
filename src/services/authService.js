import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import {
  auth,
  db,
  getFirebaseErrorMessage,
} from '../firebase/config';

import {
  normalizeRollNumber,
} from '../utils/helpers';


/*
 * STUDENT LOGIN
 *
 * Accepts Roll Number (e.g. 23IT001) or Email Address
 */
export const loginWithRollNumber = async (
  identifier,
  password
) => {
  if (!auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  const rawInput = String(identifier || '').trim();
  if (!rawInput) {
    throw new Error('Roll number or email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  try {
    let email = '';

    if (rawInput.includes('@')) {
      email = rawInput.toLowerCase();
    } else {
      const normalizedRoll = normalizeRollNumber(rawInput);
      console.log('[LOGIN] Looking up roll number:', normalizedRoll);

      const loginRef = doc(db, 'studentLogins', normalizedRoll);
      const loginSnapshot = await getDoc(loginRef);

      if (loginSnapshot.exists()) {
        email = loginSnapshot.data().email;
      } else {
        try {
          const studentsQuery = query(
            collection(db, 'students'),
            where('rollNumber', '==', normalizedRoll),
            limit(1)
          );
          const studentsSnapshot = await getDocs(studentsQuery);
          if (!studentsSnapshot.empty) {
            email = studentsSnapshot.docs[0].data().email;
          }
        } catch (queryErr) {
          console.warn('[LOGIN] Direct student collection lookup failed:', queryErr);
        }
      }

      if (!email) {
        console.error('[LOGIN] Roll number not found in login mappings or student profiles.');
        throw new Error('Roll number not found. Please register first.');
      }
    }

    console.log('[LOGIN] Signing in with Firebase Auth for:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('[LOGIN] Firebase Authentication successful.');

    return result.user;
  } catch (error) {
    console.error('[LOGIN] Login failed:', error);

    if (error instanceof Error && !error.code) {
      throw error;
    }

    const message = getFirebaseErrorMessage(error);
    throw new Error(message, { cause: error });
  }
};



/*
 * STUDENT REGISTRATION
 */
export const registerStudentAccount = async ({
  rollNumber,
  email,
  password,
}) => {

  if (!auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  const normalizedRoll =
    normalizeRollNumber(rollNumber);

  if (!normalizedRoll) {
    throw new Error(
      'Roll number is required.'
    );
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  try {

    /*
     * Create Firebase Authentication account.
     */
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

    const user = userCredential.user;

    /*
     * Create the roll-number login mapping.
     *
     * This document is later used during login.
     *
     * studentLogins/24IT001
     */
    await setDoc(
      doc(
        db,
        'studentLogins',
        normalizedRoll
      ),
      {
        uid: user.uid,
        rollNumber: normalizedRoll,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
      }
    );

    console.log(
      '[REGISTER] Student login mapping created.'
    );

    return user;

  } catch (error) {

    console.error(
      '[REGISTER] Registration failed:',
      error
    );

    const message =
      getFirebaseErrorMessage(error);

    throw new Error(message, { cause: error });
  }
};


/*
 * ADMIN LOGIN
 */
export const adminLogin = async (
  email,
  password
) => {

  if (!auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  try {

    const result =
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    return result.user;

  } catch (error) {

    const message =
      getFirebaseErrorMessage(error);

    throw new Error(message, { cause: error });
  }
};


/*
 * LOGOUT
 */
export const logoutUser = async () => {

  if (!auth) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  await signOut(auth);
};


/*
 * CHANGE PASSWORD
 */
export const changePassword = async (
  newPassword
) => {

  if (!auth) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  if (!auth.currentUser) {
    throw new Error(
      'You must be signed in to change the password.'
    );
  }

  await updatePassword(
    auth.currentUser,
    newPassword
  );
};