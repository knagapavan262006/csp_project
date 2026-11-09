import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCertificateById } from '../services/certificateService';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { downloadFile } from '../utils/fileUtils';

export default function StudentCertificateDetailPage() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const data = await getCertificateById(id);
        setCertificate(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [id]);

  if (loading) return <div className="page-loading">Loading certificate details...</div>;
  if (!certificate) return <div className="page-block"><h1>Certificate not found.</h1></div>;

  const viewFile = () => window.open(certificate.fileURL, '_blank', 'noopener,noreferrer');

  const handleDownload = () => {
    if (!certificate?.fileURL) return;
    const safeName = `${certificate.rollNumber || 'student'}_${(certificate.title || 'certificate').replace(/[^a-z0-9-_]+/gi, '_')}`;
    downloadFile(certificate.fileURL, safeName);
  };

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Certificate</p>
          <h1>{certificate.title}</h1>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-grid">
          <div><span>Student Name</span><strong>{certificate.studentName}</strong></div>
          <div><span>Roll Number</span><strong>{certificate.rollNumber}</strong></div>
          <div><span>Branch</span><strong>{certificate.branch || '—'}</strong></div>
          <div><span>Year</span><strong>{certificate.year || '—'}</strong></div>
          <div><span>Achievement Title</span><strong>{certificate.title}</strong></div>
          <div><span>Category</span><strong>{certificate.category}</strong></div>
          <div><span>Organization</span><strong>{certificate.organization}</strong></div>
          <div><span>Achievement Date</span><strong>{formatDate(certificate.achievementDate)}</strong></div>
          <div><span>Uploaded Date</span><strong>{formatDate(certificate.uploadedAt)}</strong></div>
          <div><span>Status</span><strong><StatusBadge status={certificate.status} /></strong></div>
        </div>

        <div className="detail-description">
          <h3>Description</h3>
          <p>{certificate.description || 'No description provided.'}</p>
        </div>

        {certificate.status === 'rejected' && (
          <div className="alert alert-error">Rejection reason: {certificate.rejectionReason || 'No reason provided.'}</div>
        )}

        <div className="button-row">
          <button type="button" className="primary-btn" onClick={viewFile}>View Certificate</button>
          <button type="button" className="secondary-btn" onClick={handleDownload}>Download Document</button>
        </div>
      </div>
    </div>
  );
}

