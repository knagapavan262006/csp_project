import { useEffect, useState } from 'react';
import { getAllCertificates } from '../services/certificateService';
import { getAllStudents } from '../services/studentService';

export default function AdminDashboardPage() {
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentData, certificateData] = await Promise.all([
          getAllStudents(),
          getAllCertificates(),
        ]);
        setStudents(studentData);
        setCertificates(certificateData);
      } catch (error) {
        console.error(error);
        setError(error.message || 'Unable to load admin dashboard records.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = {
    totalStudents: students.length,
    totalCertificates: certificates.length,
    pending: certificates.filter((certificate) => String(certificate.status || 'pending').toLowerCase() === 'pending').length,
    approved: certificates.filter((certificate) => String(certificate.status || 'pending').toLowerCase() === 'approved').length,
    rejected: certificates.filter((certificate) => String(certificate.status || 'pending').toLowerCase() === 'rejected').length,
  };

  if (loading) return <div className="page-loading">Loading admin dashboard...</div>;

  if (error) {
    return (
      <div className="page-block">
        <div className="page-header">
          <div>
            <p className="eyebrow">Management</p>
            <h1>Admin Dashboard</h1>
          </div>
        </div>
        <div className="alert alert-error" role="alert">
          Could not load dashboard records: {error}
        </div>
        <button type="button" className="secondary-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Management</p>
          <h1>Admin Dashboard</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Students</span>
          <strong>{stats.totalStudents}</strong>
          <small>Registered learners</small>
        </div>
        <div className="stat-card">
          <span>Total Certificates</span>
          <strong>{stats.totalCertificates}</strong>
          <small>All submissions</small>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
          <small>Awaiting approval</small>
        </div>
        <div className="stat-card">
          <span>Approved</span>
          <strong>{stats.approved}</strong>
          <small>Verified</small>
        </div>
        <div className="stat-card">
          <span>Rejected</span>
          <strong>{stats.rejected}</strong>
          <small>Returned</small>
        </div>
      </div>
    </div>
  );
}
