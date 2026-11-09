
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  subscribeCertificatesByStudent,
  replaceRejectedCertificateFile,
} from '../services/certificateService';

import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { downloadFile } from '../utils/fileUtils';

export default function StudentCertificatesPage() {
  const { currentUser } = useAuth();

  const [certificates, setCertificates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [replacingId, setReplacingId] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = subscribeCertificatesByStudent(
      currentUser.uid,
      (data, loadError) => {
        if (loadError) {
          setError(
            loadError.message || 'Unable to load certificates.'
          );
          setLoading(false);
          return;
        }

        setError('');
        setCertificates(data || []);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const filteredCertificates = useMemo(() => {
    if (filter === 'all') {
      return certificates;
    }

    return certificates.filter(
      (certificate) =>
        String(certificate.status || 'pending').toLowerCase() ===
        filter
    );
  }, [certificates, filter]);

  const handleReplaceFile = async (certificate, event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again if needed.
    event.target.value = '';

    if (!file) {
      return;
    }

    setError('');
    setMessage('');

    if (!currentUser?.uid) {
      setError('Please log in again to replace your certificate.');
      return;
    }

    if (
      String(certificate.status || '').toLowerCase() !==
      'rejected'
    ) {
      setError('Only rejected certificates can be replaced.');
      return;
    }

    try {
      setReplacingId(certificate.id);

      await replaceRejectedCertificateFile({
        certificateId: certificate.id,
        studentUid: currentUser.uid,
        file,
      });

      setMessage(
        'Certificate file replaced successfully. Your certificate is now Pending for admin review.'
      );
    } catch (replaceError) {
      console.error(
        'Certificate replacement failed:',
        replaceError
      );

      setError(
        replaceError.message ||
          'Unable to replace the certificate file.'
      );
    } finally {
      setReplacingId('');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        Loading certificates...
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Records</p>
          <h1>My Certificates ({certificates.length})</h1>
        </div>
      </div>

      <div className="toolbar-grid">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Organization</th>
              <th>Submission Date</th>
              <th>Status</th>
              <th>Rejection Reason</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCertificates.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  {error
                    ? 'Certificates could not be loaded.'
                    : 'No certificates match the selected filter.'}
                </td>
              </tr>
            ) : (
              filteredCertificates.map((certificate) => {
                const title =
                  certificate.certificateTitle ||
                  certificate.title ||
                  'Certificate';

                const organization =
                  certificate.issuingOrganization ||
                  certificate.organization ||
                  '—';

                const isRejected =
                  String(
                    certificate.status || ''
                  ).toLowerCase() === 'rejected';

                const isReplacing =
                  replacingId === certificate.id;

                return (
                  <tr key={certificate.id}>
                    <td>
                      <strong>{title}</strong>
                    </td>

                    <td>{certificate.category || '—'}</td>

                    <td>{organization}</td>

                    <td>
                      {formatDate(certificate.uploadedAt)}
                    </td>

                    <td>
                      <StatusBadge
                        status={certificate.status || 'pending'}
                      />
                    </td>

                    <td>
                      {isRejected
                        ? certificate.rejectionReason ||
                          'No reason provided.'
                        : '—'}
                    </td>

                    <td>
                      <div className="button-row compact-row">
                        <Link
                          to={`/student/certificates/${certificate.id}`}
                          className="text-link"
                        >
                          View
                        </Link>

                        {certificate.fileURL && (
                          <button
                            type="button"
                            className="text-link"
                            onClick={() =>
                              downloadFile(
                                certificate.fileURL,
                                `${
                                  certificate.rollNumber ||
                                  'student'
                                }_${title}`
                              )
                            }
                          >
                            Open
                          </button>
                        )}

                        {isRejected && (
                          <label
                            className="text-link"
                            style={{
                              cursor: isReplacing
                                ? 'not-allowed'
                                : 'pointer',
                              opacity: isReplacing ? 0.6 : 1,
                            }}
                          >
                            {isReplacing
                              ? 'Uploading...'
                              : 'Replace File'}

                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                              disabled={isReplacing}
                              onChange={(event) =>
                                handleReplaceFile(
                                  certificate,
                                  event
                                )
                              }
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
