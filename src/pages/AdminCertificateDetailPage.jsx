import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCertificateById, updateCertificateStatus } from '../services/certificateService';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { downloadFile } from '../utils/fileUtils';

export default function AdminCertificateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const data = await getCertificateById(id);
        setCertificate(data);
      } catch (loadError) {
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [id]);

  const handleDownload = () => {
    if (!certificate?.fileURL) return;
    const safeName = `${certificate.rollNumber || 'student'}_${(certificate.title || 'certificate').replace(/[^a-z0-9-_]+/gi, '_')}`;
    downloadFile(certificate.fileURL, safeName);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setError('');
    try {
      await updateCertificateStatus({
        certificateId: id,
        status: 'approved',
        reviewedBy: currentUser?.email || 'admin',
      });
      setCertificate((prev) => ({ ...prev, status: 'approved', rejectionReason: '' }));
      navigate('/admin/certificates', { replace: true });
    } catch (approvalError) {
      setError(approvalError.message || 'Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await updateCertificateStatus({
        certificateId: id,
        status: 'rejected',
        rejectionReason: rejectReason,
        reviewedBy: currentUser?.email || 'admin',
      });
      setCertificate((prev) => ({ ...prev, status: 'rejected', rejectionReason: rejectReason }));
      navigate('/admin/certificates', { replace: true });
    } catch (rejectError) {
      setError(rejectError.message || 'Rejection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading certificate...</div>;
  if (!certificate) return <div className="page-block"><h1>Certificate not found.</h1></div>;

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Review</p>
          <h1>{certificate.title}</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-card">
        <div className="detail-grid">
          <div><span>Student Name</span><strong>{certificate.studentName}</strong></div>
          <div><span>Roll Number</span><strong>{certificate.rollNumber}</strong></div>
          <div><span>Branch</span><strong>{certificate.branch || '—'}</strong></div>
          <div><span>Year</span><strong>{certificate.year || '—'}</strong></div>
          <div><span>Achievement</span><strong>{certificate.title}</strong></div>
          <div><span>Category</span><strong>{certificate.category}</strong></div>
          <div><span>Organization</span><strong>{certificate.organization}</strong></div>
          <div><span>Achievement Date</span><strong>{formatDate(certificate.achievementDate)}</strong></div>
          <div><span>Submitted</span><strong>{formatDate(certificate.uploadedAt)}</strong></div>
          <div><span>Status</span><strong><StatusBadge status={certificate.status} /></strong></div>
        </div>

        <div className="detail-description">
          <h3>Description</h3>
          <p>{certificate.description || 'No description provided.'}</p>
        </div>

        {certificate.rejectionReason && (
          <div className="alert alert-error">
            <strong>Rejection Reason:</strong> {certificate.rejectionReason}
          </div>
        )}

        <div className="button-row">
          <a href={certificate.fileURL} target="_blank" rel="noreferrer" className="primary-btn button-anchor">View Document</a>
          <button type="button" className="secondary-btn" onClick={handleDownload}>Download Document</button>
        </div>

        <div className="decision-box">
          <label>
            Rejection Reason
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows="3" placeholder="Enter reason if rejecting" />
          </label>
          <div className="button-row">
            <button type="button" className="primary-btn" onClick={handleApprove} disabled={submitting}>Approve</button>
            <button type="button" className="danger-btn" onClick={handleReject} disabled={submitting}>Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
}

