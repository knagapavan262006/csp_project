import { useEffect, useState } from 'react';
import { getStudentProfile, updateStudentProfile } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { BRANCHES, ACADEMIC_YEARS } from '../utils/constants';
import { changePassword } from '../services/authService';

export default function StudentProfilePage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ phone: '', branch: '', year: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        const student = await getStudentProfile(currentUser.uid);
        setProfile(student);
        setForm({
          phone: student?.phone || '',
          branch: student?.branch || '',
          year: student?.year || '',
        });
      } catch (profileError) {
        setError(profileError.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateStudentProfile(currentUser.uid, {
        phone: form.phone.trim(),
        branch: form.branch,
        year: form.year,
        profileCompleted: Boolean(form.branch && form.year),
      });
      setMessage('Profile updated successfully.');
      setProfile((prev) => ({ ...prev, ...form, profileCompleted: true }));
    } catch (profileError) {
      setError(profileError.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setMessage('');
    setError('');

    if (passwordForm.password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Passwords do not match.');
      setPasswordSaving(false);
      return;
    }

    try {
      await changePassword(passwordForm.password);
      setMessage('Password changed successfully.');
      setPasswordForm({ password: '', confirmPassword: '' });
    } catch (passwordError) {
      setError(passwordError.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading profile...</div>;

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Student account</p>
          <h1>Profile</h1>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="profile-grid">
        <div className="panel-card">
          <h3>Student Information</h3>
          <div className="detail-list">
            <div><span>Name</span><strong>{profile?.name || '—'}</strong></div>
            <div><span>Roll Number</span><strong>{profile?.rollNumber || '—'}</strong></div>
            <div><span>Phone</span><strong>{profile?.phone || '—'}</strong></div>
            <div><span>Email</span><strong>{profile?.email || '—'}</strong></div>
            <div><span>Branch</span><strong>{profile?.branch || '—'}</strong></div>
            <div><span>Academic Year</span><strong>{profile?.year || '—'}</strong></div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Update Profile</h3>
          <form onSubmit={handleProfileSubmit} className="auth-form">
            <label>
              Phone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              Branch
              <select value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })}>
                <option value="">Select branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </label>
            <label>
              Academic Year
              <select value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>
                <option value="">Select year</option>
                {ACADEMIC_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>

      <div className="panel-card password-card">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="auth-form inline-form">
          <label>
            New Password
            <input
              type="password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
            />
          </label>
          <button type="submit" className="secondary-btn" disabled={passwordSaving}>
            {passwordSaving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
