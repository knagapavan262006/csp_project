import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeCertificatesByStudent } from '../services/certificateService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { getStudentProfile } from '../services/studentService';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function StudentDashboardPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [profileLoading, setProfileLoading] = useState(Boolean(currentUser));
  const [certificatesLoading, setCertificatesLoading] = useState(Boolean(currentUser));
  const [profileError, setProfileError] = useState('');
  const [certificateError, setCertificateError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!currentUser?.uid) {
        if (mounted) setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        setProfileError('');
        const student = await getStudentProfile(currentUser.uid);

        if (!mounted) return;
        setProfile(student || {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
          email: currentUser.email || '',
          rollNumber: '',
          department: '',
          academicYear: '',
        });
      } catch (error) {
        if (!mounted) return;
        setProfileError(error?.message || 'Unable to load student profile.');
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCertificatesLoading(true);
    setCertificateError('');

    const unsubscribe = subscribeCertificatesByStudent(currentUser.uid, (data, error) => {
      if (error) {
        setCertificateError(error.message || 'Unable to load certificates.');
        setCertificatesLoading(false);
        return;
      }

      setCertificateError('');
      setCertificates(data || []);
      setCertificatesLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    certificates.forEach((certificate) => {
      const status = String(certificate?.status || 'pending').trim().toLowerCase();
      if (status === 'approved') approved += 1;
      else if (status === 'rejected') rejected += 1;
      else pending += 1;
    });

    return { total: certificates.length, pending, approved, rejected };
  }, [certificates]);

  const getStatus = (certificate) => {
    const status = String(certificate?.status || 'pending').trim().toLowerCase();
    if (status === 'approved' || status === 'rejected' || status === 'pending') return status;
    return 'pending';
  };

  const loading = profileLoading || certificatesLoading;

  if (loading) {
    return <div className="page-loading"><h2>Loading dashboard...</h2><p>Please wait while we load your profile and certificates.</p></div>;
  }

  if (profileError) {
    return (
      <div className="page-block">
        <div className="page-header">
          <div><p className="eyebrow">Student portal</p><h1>Dashboard</h1></div>
        </div>
        <div className="error-card">
          <h3>Unable to load your profile</h3>
          <p>{profileError}</p>
          <button type="button" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Student portal</p>
          <h1>Dashboard</h1>
          <p>Welcome back, <strong>{profile?.name || 'Student'}</strong>.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Student Name</span>
          <strong>{profile?.name || '—'}</strong>
          <small>{profile?.rollNumber || 'Roll number not set'}</small>
        </div>

        <div className="stat-card">
          <span>Department</span>
          <strong>{profile?.department || profile?.branch || 'Not added yet'}</strong>
          <small>{profile?.academicYear || profile?.year || 'Year not set'}</small>
        </div>

        <div className="stat-card">
          <span>Total Certificates</span>
          <strong>{stats.total}</strong>
          <small>All submitted certificates</small>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
          <small>Awaiting admin review</small>
        </div>

        <div className="stat-card">
          <span>Approved</span>
          <strong>{stats.approved}</strong>
          <small>Approved certificates</small>
        </div>

        <div className="stat-card">
          <span>Rejected</span>
          <strong>{stats.rejected}</strong>
          <small>Certificates needing correction</small>
        </div>
      </div>

      <div className="page-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Achievements</p>
            <h2>My Certificates</h2>
            <p>View all certificates you have submitted and their current review status.</p>
          </div>
        </div>

        {certificateError && (
          <div className="error-card">
            <h3>Unable to load certificates</h3>
            <p>{certificateError}</p>
            <button type="button" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}

        {!certificateError && certificates.length === 0 && (
          <div className="empty-state">
            <h3>No certificates yet</h3>
            <p>You have not submitted any achievement certificates yet.</p>
            <Link to="/student/add-achievement" className="button">Upload Certificate</Link>
          </div>
        )}

        {!certificateError && certificates.length > 0 && (
          <div className="certificate-list">
            {certificates.map((certificate) => {
              const status = getStatus(certificate);
              const title = certificate.certificateTitle || certificate.title || 'Certificate';
              const organization = certificate.issuingOrganization || certificate.organization || '';
              const category = certificate.category || 'Achievement';

              return (
                <div className="certificate-card" key={certificate.id}>
                  <div className="certificate-info">
                    <h3><Link to={`/student/certificates/${certificate.id}`} className="text-link">{title}</Link></h3>
                    <p><strong>Category:</strong> {category}</p>
                    {organization && <p><strong>Organization:</strong> {organization}</p>}
                    <p><strong>Achievement Date:</strong> {formatDate(certificate.achievementDate)}</p>
                    <p><strong>Submitted:</strong> {formatDate(certificate.uploadedAt)}</p>
                    {certificate.fileName && <p><strong>File:</strong> {certificate.fileName}</p>}
                    {status === 'rejected' && certificate.rejectionReason && (
                      <div className="error-card">
                        <strong>Rejection Reason</strong>
                        <p>{certificate.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="certificate-actions">
                    <StatusBadge status={status} />
                    <Link to={`/student/certificates/${certificate.id}`} className="text-link">View Details</Link>
                    {certificate.fileURL && <a href={certificate.fileURL} target="_blank" rel="noopener noreferrer" className="text-link">View Certificate</a>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}