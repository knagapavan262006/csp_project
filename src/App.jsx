import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout, StudentLayout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentAddAchievementPage from './pages/StudentAddAchievementPage';
import StudentCertificatesPage from './pages/StudentCertificatesPage';
import StudentCertificateDetailPage from './pages/StudentCertificateDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminStudentsPage from './pages/AdminStudentsPage';
import AdminCertificatesPage from './pages/AdminCertificatesPage';
import AdminCertificateDetailPage from './pages/AdminCertificateDetailPage';
import './App.css';

function AppRoutes() {
  const { currentUser, role } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={currentUser ? (role === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/login'} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentDashboardPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentProfilePage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/add-achievement"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentAddAchievementPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentCertificatesPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/certificates/:id"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout>
                <StudentCertificateDetailPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin" redirectPath="/admin/login">
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRole="admin" redirectPath="/admin/login">
              <AdminLayout>
                <AdminStudentsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/certificates"
          element={
            <ProtectedRoute allowedRole="admin" redirectPath="/admin/login">
              <AdminLayout>
                <AdminCertificatesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/certificates/:id"
          element={
            <ProtectedRoute allowedRole="admin" redirectPath="/admin/login">
              <AdminLayout>
                <AdminCertificateDetailPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
