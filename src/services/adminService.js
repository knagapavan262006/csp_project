import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const getAdminProfile = async (uid) => {
  if (!db) throw new Error('Firebase is not configured. Add your .env values first.');
  const snapshot = await getDoc(doc(db, 'admins', uid));
  return snapshot.exists() ? snapshot.data() : null;
};

export const getAllStudents = async () => {
  if (!db) throw new Error('Firebase is not configured. Add your .env values first.');
  const snapshot = await getDocs(query(collection(db, 'students'), limit(100)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getAllCertificates = async () => {
  if (!db) throw new Error('Firebase is not configured. Add your .env values first.');
  const snapshot = await getDocs(query(collection(db, 'certificates'), limit(100)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getStudentCertificates = async (studentUid) => {
  if (!db) throw new Error('Firebase is not configured. Add your .env values first.');
  const q = query(collection(db, 'certificates'), where('studentId', '==', studentUid), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

