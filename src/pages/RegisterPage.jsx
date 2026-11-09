import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerStudentAccount } from '../services/authService';
import { createStudentDocument } from '../services/studentService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await registerStudentAccount({
        name: form.name,
        rollNumber: form.rollNumber,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });

      await createStudentDocument(user, {
        name: form.name,
        rollNumber: form.rollNumber,
        phone: form.phone,
        email: form.email,
        branch: '',
        year: '',
        profileCompleted: false,
      });

      navigate('/student/profile', { replace: true });
    } catch (registerError) {
      setError(registerError.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card wider-card">
        <div className="auth-header">
          <div className="brand-pill">SACS</div>
          <h1>Student Registration</h1>
          <p>Complete your account setup to begin uploading certificates.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form two-column-form">
          <label>
            Student Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" />
          </label>

          <label>
            Roll Number
            <input name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="23IT001" />
          </label>

          <label>
            Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
          </label>

          <label>
            Email Address
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@college.edu" />
          </label>

          <label className="full-span">
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Use your roll number as initial password" />
          </label>

          {error && <div className="alert alert-error full-span">{error}</div>}

          <button type="submit" className="primary-btn full-span" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already registered? Login</Link>
          <Link to="/admin/login">Admin login</Link>
        </div>
      </div>
    </div>
  );
}
