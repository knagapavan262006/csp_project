import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/authService';
import { getAdminProfile } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await adminLogin(form.email, form.password);
      const adminProfile = await getAdminProfile(user.uid);

      if (!adminProfile) {
        throw new Error('This account is not authorized as an admin.');
      }

      setRole('admin');
      navigate('/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-pill">ADMIN</div>
          <h1>Faculty Login</h1>
          <p>Authorized administrators only.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Admin Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="admin@college.edu"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter password"
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Checking access...' : 'Login as Admin'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to Student Login</Link>
        </div>
      </div>
    </div>
  );
}
