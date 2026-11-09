import { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  loginWithRollNumber,
} from '../services/authService';

import {
  useAuth,
} from '../context/AuthContext';

export default function LoginPage() {
  const navigate =
    useNavigate();

  const {
    setCurrentUser,
    setRole,
  } = useAuth();

  const [form, setForm] =
    useState({
      rollNumber: '',
      password: '',
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleRollNumberChange =
    (event) => {
      const value =
        event.target.value;

      setForm((previous) => ({
        ...previous,
        rollNumber: value,
      }));

      if (error) {
        setError('');
      }
    };

  const handlePasswordChange =
    (event) => {
      const value =
        event.target.value;

      setForm((previous) => ({
        ...previous,
        password: value,
      }));

      if (error) {
        setError('');
      }
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      /*
       * Prevent duplicate login requests.
       */
      if (loading) {
        return;
      }

      setError('');

      const rollNumber =
        form.rollNumber.trim();

      const password =
        form.password;

      if (!rollNumber) {
        setError(
          'Please enter your roll number or email.'
        );

        return;
      }

      if (!password) {
        setError(
          'Please enter your password.'
        );

        return;
      }

      setLoading(true);

      try {
        console.log(
          '[STUDENT LOGIN] Login started for:',
          rollNumber
        );

        /*
         * Firebase Authentication.
         *
         * loginWithRollNumber returns the authenticated
         * Firebase user.
         */
        const user =
          await loginWithRollNumber(
            rollNumber,
            password
          );

        console.log(
          '[STUDENT LOGIN] Firebase authentication successful:',
          user.uid
        );

        /*
         * IMPORTANT FIX
         *
         * Immediately synchronize the authenticated
         * Firebase user with AuthContext.
         *
         * This prevents ProtectedRoute from seeing
         * currentUser = null during the small window
         * before onAuthStateChanged finishes.
         */
        setCurrentUser(user);

        /*
         * Students authenticated through this page
         * are student accounts.
         *
         * AuthContext will independently verify the
         * role as well.
         */
        setRole('student');

        console.log(
          '[STUDENT LOGIN] Auth context synchronized.'
        );

        /*
         * Now navigate to the student dashboard.
         *
         * ProtectedRoute will see the authenticated
         * user instead of temporarily seeing null.
         */
        navigate(
          '/student/dashboard',
          {
            replace: true,
          }
        );
      } catch (loginError) {
        console.error(
          '[STUDENT LOGIN] Login failed:',
          loginError
        );

        setError(
          loginError?.message ||
          'Login failed. Please check your roll number and password.'
        );

        setLoading(false);
      }
    };

  return (
    <div className="auth-shell">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">

          <div className="brand-pill">
            SACS
          </div>

          <h1>
            Student Login
          </h1>

          <p>
            Use your registered roll number or email
            and password to access your dashboard.
          </p>

        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          {/* Roll Number / Email */}
          <label htmlFor="student-roll-number">
            Roll Number or Email

            <input
              id="student-roll-number"
              type="text"
              value={form.rollNumber}
              onChange={
                handleRollNumberChange
              }
              placeholder="Enter roll number or email"
              disabled={loading}
              required
            />
          </label>

          {/* Password */}
          <label htmlFor="student-password">
            Password

            <input
              id="student-password"
              type="password"
              value={form.password}
              onChange={
                handlePasswordChange
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </label>

          {/* Error */}
          {error && (
            <div
              className="alert alert-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Login'}
          </button>

        </form>

        {/* Navigation */}
        <div className="auth-links">

          <Link to="/register">
            Need an account? Register
          </Link>

          <Link to="/admin/login">
            Admin login
          </Link>

        </div>

      </div>
    </div>
  );
}