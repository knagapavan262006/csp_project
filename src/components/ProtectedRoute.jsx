import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  children,
  allowedRole,
  redirectPath = '/login',
}) {
  const {
    currentUser,
    role,
    loading,
  } = useAuth();

  const location =
    useLocation();

  /*
   * Firebase authentication or role detection
   * is still being initialized.
   *
   * Never redirect during this state.
   */
  if (loading) {
    return (
      <div className="page-loading">
        Loading your session...
      </div>
    );
  }

  /*
   * Authentication has finished and there is
   * genuinely no signed-in user.
   */
  if (!currentUser) {
    return (
      <Navigate
        to={redirectPath}
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /*
   * User is authenticated, but their role does
   * not match this protected route.
   */
  if (
    allowedRole &&
    role !== allowedRole
  ) {
    /*
     * If role is temporarily unavailable,
     * don't redirect unnecessarily.
     *
     * This is especially useful during the tiny
     * transition immediately after login.
     */
    if (!role) {
      return (
        <div className="page-loading">
          Checking your account...
        </div>
      );
    }

    const fallback =
      allowedRole === 'student'
        ? '/student/dashboard'
        : '/admin/dashboard';

    return (
      <Navigate
        to={fallback}
        replace
      />
    );
  }

  return children;
}