import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/config';

import { normalizeRollNumber } from '../utils/helpers';

const normalizeStudentRecord = (student = {}) => {
  const normalizedRoll = normalizeRollNumber(student.rollNumber || '');
  const uid = student.uid || student.studentUid || student.id || '';

  return {
    ...student,
    id: student.id || uid,
    uid,
    studentUid: student.studentUid || uid,
    name: student.name || '',
    email: String(student.email || '').trim().toLowerCase(),
    role: student.role || 'student',
    rollNumber: normalizedRoll,
    department: student.department || student.branch || '',
    branch: student.branch || student.department || '',
    academicYear: student.academicYear || student.year || '',
    year: student.year || student.academicYear || '',
    phone: student.phone || '',
    profileCompleted: Boolean(student.profileCompleted),
  };
};

export const createStudentDocument = async (user, extraData = {}) => {
  if (!db) {
    throw new Error('Firebase is not configured. Add your .env values first.');
  }

  if (!user?.uid) {
    throw new Error('Authenticated student UID is missing.');
  }

  const data = {
    name: extraData.name || '',
    studentUid: user.uid,
    uid: user.uid,
    role: 'student',
    email: String(extraData.email || user.email || '').trim().toLowerCase(),
    rollNumber: normalizeRollNumber(extraData.rollNumber || ''),
    phone: extraData.phone || '',
    department: extraData.department || extraData.branch || '',
    branch: extraData.branch || extraData.department || '',
    academicYear: extraData.academicYear || extraData.year || '',
    year: extraData.year || extraData.academicYear || '',
    profileCompleted: Boolean(extraData.profileCompleted),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'students', user.uid), data, { merge: false });
  return normalizeStudentRecord(data);
};

export const getStudentProfile = async (uid) => {
  if (!db) {
    throw new Error('Firebase is not configured. Add your .env values first.');
  }

  if (!uid) {
    throw new Error('Student UID is required.');
  }

  const snapshot = await getDoc(doc(db, 'students', uid));
  if (!snapshot.exists()) return null;

  return normalizeStudentRecord(snapshot.data());
};

export const getStudentByRollNumber = async (rollNumber) => {
  if (!db) {
    throw new Error('Firebase is not configured. Add your .env values first.');
  }

  const normalizedRoll = normalizeRollNumber(rollNumber);
  if (!normalizedRoll) return null;

  const q = query(collection(db, 'students'), where('rollNumber', '==', normalizedRoll), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return normalizeStudentRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
};

export const updateStudentProfile = async (uid, updates) => {
  if (!db) {
    throw new Error('Firebase is not configured. Add your .env values first.');
  }

  if (!uid) {
    throw new Error('Student UID is required.');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Profile updates are required.');
  }

  const nextUpdates = { ...updates };
  delete nextUpdates.uid;
  delete nextUpdates.studentUid;
  delete nextUpdates.role;
  delete nextUpdates.email;
  delete nextUpdates.rollNumber;

  if (typeof nextUpdates.department === 'string') {
    nextUpdates.branch = nextUpdates.department;
  }
  if (typeof nextUpdates.academicYear === 'string') {
    nextUpdates.year = nextUpdates.academicYear;
  }

  nextUpdates.updatedAt = new Date().toISOString();

  await updateDoc(doc(db, 'students', uid), nextUpdates);
};

export const getAllStudents = async () => {
  if (!db) {
    throw new Error('Firebase is not configured. Add your .env values first.');
  }

  const q = query(collection(db, 'students'), limit(100));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => normalizeStudentRecord({ id: docItem.id, ...docItem.data() }));
};