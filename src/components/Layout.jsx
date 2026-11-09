import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, UserCircle2, Trophy, FolderKanban, Users, CheckCheck } from 'lucide-react';
import { logoutUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function Sidebar({ items, title }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-pill">SACS</div>
        <h2>{title}</h2>
      </div>

      <nav className="nav-list">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function StudentLayout({ children }) {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const items = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Profile', icon: UserCircle2 },
    { to: '/student/add-achievement', label: 'Add Achievement', icon: Trophy },
    { to: '/student/certificates', label: 'My Certificates', icon: FolderKanban },
  ];

  const handleLogout = async () => {
    await logoutUser();
    setRole(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar items={items} title="Student Portal" />
      <main className="main-panel">
        <header className="topbar">
          <div></div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}

export function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const items = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/certificates', label: 'Certificates', icon: FolderKanban },
    { to: '/admin/certificates?status=pending', label: 'Pending', icon: CheckCheck },
    { to: '/admin/certificates?status=approved', label: 'Approved', icon: CheckCheck },
    { to: '/admin/certificates?status=rejected', label: 'Rejected', icon: CheckCheck },
  ];

  const handleLogout = async () => {
    await logoutUser();
    setRole(null);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar items={items} title="Admin Portal" />
      <main className="main-panel">
        <header className="topbar">
          <div></div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
