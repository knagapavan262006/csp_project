import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentProfile } from '../services/studentService';
import { uploadCertificate } from '../services/certificateService';
import { ACHIEVEMENT_CATEGORIES, MAX_FILE_SIZE } from '../utils/constants';

export default function StudentAddAchievementPage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    certificateTitle: '',
    category: '',
    issuingOrganization: '',
    description: '',
    achievementDate: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const loadStudent = async () => {
      if (!currentUser) return;

      try {
        const data = await getStudentProfile(currentUser.uid);
        setStudent(data);
      } catch (loadError) {
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [currentUser]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const extension = String(selected.name || '').split('.').pop()?.toLowerCase();
    const mimeType = String(selected.type || '').toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedExtensions.includes(extension || '')) {
      setError('Only PDF, JPG, JPEG, and PNG files are allowed.');
      setFile(null);
      return;
    }

    if (mimeType && !allowedMimeTypes.includes(mimeType) && mimeType !== 'image/jpg') {
      setError('Only PDF, JPG, JPEG, and PNG files are allowed.');
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('File size must be 5 MB or less.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    setMessage('');
    setError('');

    if (!student || !file) {
      setError('Please complete your profile and select a certificate file.');
      setUploading(false);
      return;
    }

    try {
      await uploadCertificate({
        studentUid: currentUser.uid,
        student,
        formData: {
          ...form,
          title: form.certificateTitle,
          organization: form.issuingOrganization,
        },
        file,
        onProgress: (value) => setProgress(value),
      });

      setMessage('Certificate submitted successfully and is now pending review.');
      setForm({ certificateTitle: '', category: '', issuingOrganization: '', description: '', achievementDate: '' });
      setFile(null);
      setProgress(0);
      event.target.reset();
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="page-loading">Loading form...</div>;

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Achievements</p>
          <h1>Add Achievement</h1>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form two-column-form panel-card form-panel">
        <label>
          Achievement Title
          <input
            value={form.certificateTitle}
            onChange={(event) => setForm({ ...form, certificateTitle: event.target.value })}
            placeholder="National Level Coding Contest"
          />
        </label>

        <label>
          Category
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            <option value="">Select category</option>
            {ACHIEVEMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          Organization / Institution
          <input
            value={form.issuingOrganization}
            onChange={(event) => setForm({ ...form, issuingOrganization: event.target.value })}
            placeholder="NPTEL / College / Company"
          />
        </label>

        <label>
          Achievement Date
          <input type="date" value={form.achievementDate} onChange={(event) => setForm({ ...form, achievementDate: event.target.value })} />
        </label>

        <label className="full-span">
          Description
          <textarea value={form.description} rows="4" onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the achievement in detail." />
        </label>

        <label className="full-span file-upload-label">
          Certificate File
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
          {file ? (
            <span className="file-meta">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          ) : (
            <span className="file-meta">No file selected</span>
          )}
        </label>

        {uploading && (
          <div className="progress-box full-span">
            <div className="progress-bar">
              <span style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <strong>{Math.round(progress)}%</strong>
          </div>
        )}

        <button type="submit" className="primary-btn full-span" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Submit Certificate'}
        </button>
      </form>
    </div>
  );
}
