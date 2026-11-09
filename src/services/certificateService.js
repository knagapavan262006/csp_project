
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/config';

import { uploadCertificateToCloudinary } from './cloudinaryService';

import {
  makeId,
  normalizeRollNumber,
} from '../utils/helpers';

const getStatusValue = (value) =>
  String(value || 'pending').trim().toLowerCase();

const normalizeCertificateRecord = (certificate = {}) => {
  const studentUid =
    certificate.studentUid ||
    certificate.studentId ||
    certificate.uid ||
    '';

  const studentName =
    certificate.studentName ||
    certificate.name ||
    '';

  const rollNumber = normalizeRollNumber(
    certificate.rollNumber || ''
  );

  const department =
    certificate.department ||
    certificate.branch ||
    '';

  const academicYear =
    certificate.academicYear ||
    certificate.year ||
    '';

  const title =
    certificate.certificateTitle ||
    certificate.title ||
    '';

  const organization =
    certificate.issuingOrganization ||
    certificate.organization ||
    '';

  return {
    ...certificate,
    id: certificate.id || '',
    studentUid,
    studentId: studentUid,
    uid: studentUid,
    studentName,
    rollNumber,
    department,
    branch: department,
    academicYear,
    year: academicYear,
    certificateTitle: title,
    title,
    issuingOrganization: organization,
    organization,
    fileURL: certificate.fileURL || certificate.fileUrl || '',
    status: getStatusValue(certificate.status),
    rejectionReason: certificate.rejectionReason || '',
    uploadedAt:
      certificate.uploadedAt ||
      certificate.createdAt ||
      new Date().toISOString(),
    reviewedAt: certificate.reviewedAt || '',
    reviewedBy: certificate.reviewedBy || '',
  };
};

export const getCertificatesByStudent = async (uid) => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  if (!uid) {
    throw new Error('Student authentication UID is missing.');
  }

  const certificatesRef = collection(db, 'certificates');

  const snapshots = await Promise.all(
    ['studentUid', 'studentId', 'uid'].map((field) =>
      getDocs(
        query(
          certificatesRef,
          where(field, '==', uid),
          limit(50)
        )
      )
    )
  );

  const certificatesById = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((item) => {
      certificatesById.set(
        item.id,
        normalizeCertificateRecord({
          id: item.id,
          ...item.data(),
        })
      );
    });
  });

  return [...certificatesById.values()].sort(
    (a, b) =>
      new Date(b.uploadedAt || 0) -
      new Date(a.uploadedAt || 0)
  );
};

export const subscribeCertificatesByStudent = (
  uid,
  callback
) => {
  if (!db || !uid) {
    if (callback) {
      callback(
        [],
        new Error('Student authentication UID is missing.')
      );
    }

    return () => {};
  }

  const certificatesRef = collection(db, 'certificates');
  const resultsByField = new Map();
  let hasReportedError = false;

  const notify = () => {
    const certificatesById = new Map();

    resultsByField.forEach((records) => {
      records.forEach((record) => {
        certificatesById.set(record.id, record);
      });
    });

    const certificates = [...certificatesById.values()].sort(
      (a, b) =>
        new Date(b.uploadedAt || 0) -
        new Date(a.uploadedAt || 0)
    );

    if (callback) {
      callback(certificates);
    }
  };

  const unsubscribers = ['studentUid', 'studentId', 'uid'].map(
    (field) =>
      onSnapshot(
        query(
          certificatesRef,
          where(field, '==', uid),
          limit(50)
        ),
        (snapshot) => {
          resultsByField.set(
            field,
            snapshot.docs.map((item) =>
              normalizeCertificateRecord({
                id: item.id,
                ...item.data(),
              })
            )
          );

          notify();
        },
        (error) => {
          if (!hasReportedError) {
            hasReportedError = true;

            console.error(
              `Certificate listener failed for ${field}:`,
              error
            );

            if (callback) {
              callback(null, error);
            }
          }
        }
      )
  );

  return () =>
    unsubscribers.forEach((unsubscribe) => unsubscribe());
};

export const syncStudentCertificates = async (
  studentUid,
  rollNumber = ''
) => {
  if (!db || !studentUid || !rollNumber) return;

  const normalizedRoll = normalizeRollNumber(rollNumber);

  if (!normalizedRoll) return;

  try {
    const q = query(
      collection(db, 'certificates'),
      where('rollNumber', '==', normalizedRoll),
      limit(50)
    );

    const snapshot = await getDocs(q);

    for (const itemDoc of snapshot.docs) {
      const data = itemDoc.data();

      const nextRecord = {
        studentUid,
        studentId: studentUid,
        uid: studentUid,
      };

      if (
        data.studentUid !== studentUid ||
        data.studentId !== studentUid ||
        data.uid !== studentUid
      ) {
        await updateDoc(
          doc(db, 'certificates', itemDoc.id),
          nextRecord
        );
      }
    }
  } catch (syncError) {
    console.warn(
      'syncStudentCertificates warning:',
      syncError
    );
  }
};

export const getCertificateById = async (certificateId) => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  if (!certificateId) {
    throw new Error('Certificate ID is required.');
  }

  const snapshot = await getDoc(
    doc(db, 'certificates', certificateId)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeCertificateRecord({
    id: snapshot.id,
    ...snapshot.data(),
  });
};

export const getAllCertificates = async () => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  const q = query(
    collection(db, 'certificates'),
    limit(200)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) =>
      normalizeCertificateRecord({
        id: item.id,
        ...item.data(),
      })
    )
    .sort(
      (a, b) =>
        new Date(b.uploadedAt || 0) -
        new Date(a.uploadedAt || 0)
    );
};

const validateCertificateFile = (file) => {
  if (!file) {
    throw new Error('No certificate file selected.');
  }

  const extension = String(file.name || '')
    .split('.')
    .pop()
    ?.toLowerCase();

  const mimeType = String(file.type || '').toLowerCase();

  const allowedExtensions = [
    'pdf',
    'jpg',
    'jpeg',
    'png',
  ];

  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  if (!allowedExtensions.includes(extension || '')) {
    throw new Error(
      'Only PDF, JPG, JPEG, and PNG files are allowed.'
    );
  }

  if (
    mimeType &&
    !allowedMimeTypes.includes(mimeType) &&
    mimeType !== 'image/jpg'
  ) {
    throw new Error(
      'Only PDF, JPG, JPEG, and PNG files are allowed.'
    );
  }

  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be 5 MB or less.');
  }
};

export const uploadCertificate = async ({
  studentUid,
  student,
  formData,
  file,
  onProgress,
}) => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  if (!studentUid) {
    throw new Error('Student authentication UID is missing.');
  }

  validateCertificateFile(file);

  const certificateTitle = String(
    formData?.certificateTitle ||
      formData?.title ||
      ''
  ).trim();

  const issuingOrganization = String(
    formData?.issuingOrganization ||
      formData?.organization ||
      ''
  ).trim();

  const category = String(formData?.category || '').trim();
  const description = String(formData?.description || '').trim();
  const achievementDate = String(
    formData?.achievementDate || ''
  ).trim();

  if (!certificateTitle) {
    throw new Error('Achievement title is required.');
  }

  if (!category) {
    throw new Error('Category is required.');
  }

  if (!issuingOrganization) {
    throw new Error('Issuing organization is required.');
  }

  if (!achievementDate) {
    throw new Error('Achievement date is required.');
  }

  const certificateId = makeId();
  const fileName = file.name || `${certificateId}.pdf`;
  const safeFileName = fileName.replace(/\s+/g, '_');

  const cloudinaryResult = await uploadCertificateToCloudinary(
    file,
    onProgress
  );

  if (!cloudinaryResult?.secure_url) {
    throw new Error(
      'Cloudinary upload failed. Certificate was not saved.'
    );
  }

  const now = new Date().toISOString();

  const certificateData = {
    studentUid,
    studentId: studentUid,
    uid: studentUid,
    studentName: student?.name || '',
    rollNumber: normalizeRollNumber(
      student?.rollNumber || ''
    ),
    department:
      student?.department || student?.branch || '',
    branch:
      student?.branch || student?.department || '',
    academicYear:
      student?.academicYear || student?.year || '',
    year:
      student?.year || student?.academicYear || '',
    certificateTitle,
    title: certificateTitle,
    category,
    issuingOrganization,
    organization: issuingOrganization,
    achievementDate,
    description,
    fileName: safeFileName,
    originalFileName: safeFileName,
    fileURL: cloudinaryResult.secure_url,
    fileUrl: cloudinaryResult.secure_url,
    storagePath:
      cloudinaryResult.public_id ||
      `cloudinary/${certificateId}`,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size || 0,
    status: 'pending',
    rejectionReason: '',
    uploadedAt: now,
    createdAt: now,
    reviewedAt: '',
    reviewedBy: '',
  };

  await setDoc(
    doc(db, 'certificates', certificateId),
    certificateData
  );

  return normalizeCertificateRecord({
    id: certificateId,
    ...certificateData,
  });
};

// Replace the file of an existing rejected certificate.
export const replaceRejectedCertificateFile = async ({
  certificateId,
  studentUid,
  file,
  onProgress,
}) => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  if (!certificateId) {
    throw new Error('Certificate ID is required.');
  }

  if (!studentUid) {
    throw new Error('Student authentication UID is missing.');
  }

  validateCertificateFile(file);

  const certificateRef = doc(
    db,
    'certificates',
    certificateId
  );

  const certificateSnapshot = await getDoc(certificateRef);

  if (!certificateSnapshot.exists()) {
    throw new Error('Certificate not found.');
  }

  const existingCertificate = certificateSnapshot.data();

  const ownerUid =
    existingCertificate.studentUid ||
    existingCertificate.studentId ||
    existingCertificate.uid ||
    '';

  if (ownerUid !== studentUid) {
    throw new Error(
      'You are not allowed to replace this certificate.'
    );
  }

  if (
    getStatusValue(existingCertificate.status) !== 'rejected'
  ) {
    throw new Error(
      'Only rejected certificates can be replaced.'
    );
  }

  const cloudinaryResult = await uploadCertificateToCloudinary(
    file,
    onProgress
  );

  if (!cloudinaryResult?.secure_url) {
    throw new Error(
      'Cloudinary upload failed. Your certificate was not updated.'
    );
  }

  const safeFileName = String(file.name || 'certificate')
    .replace(/\s+/g, '_');

  const now = new Date().toISOString();

  await updateDoc(certificateRef, {
    fileName: safeFileName,
    originalFileName: safeFileName,
    fileURL: cloudinaryResult.secure_url,
    fileUrl: cloudinaryResult.secure_url,
    storagePath: cloudinaryResult.public_id || '',
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size || 0,
    status: 'pending',
    rejectionReason: '',
    reviewedAt: '',
    reviewedBy: '',
    resubmittedAt: now,
  });

  return {
    id: certificateId,
    fileURL: cloudinaryResult.secure_url,
    status: 'pending',
  };
};

export const updateCertificateStatus = async ({
  certificateId,
  status,
  rejectionReason = '',
  reviewedBy = '',
}) => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  if (!certificateId) {
    throw new Error('Certificate ID is required.');
  }

  const normalizedStatus = String(status || '')
    .trim()
    .toLowerCase();

  if (!normalizedStatus) {
    throw new Error('Certificate status is required.');
  }

  await updateDoc(
    doc(db, 'certificates', certificateId),
    {
      status: normalizedStatus,
      rejectionReason:
        normalizedStatus === 'rejected'
          ? String(rejectionReason || '').trim()
          : '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy || '',
    }
  );
};

export const searchCertificates = async (searchTerm) => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add your .env values first.'
    );
  }

  const snapshot = await getDocs(
    collection(db, 'certificates')
  );

  const queryText = String(searchTerm || '')
    .toLowerCase()
    .trim();

  const certificates = snapshot.docs.map((item) =>
    normalizeCertificateRecord({
      id: item.id,
      ...item.data(),
    })
  );

  if (!queryText) return certificates;

  return certificates.filter((certificate) => {
    const fields = [
      certificate.rollNumber,
      certificate.studentName,
      certificate.title,
      certificate.category,
      certificate.certificateTitle,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return fields.some((value) =>
      value.includes(queryText)
    );
  });
};
