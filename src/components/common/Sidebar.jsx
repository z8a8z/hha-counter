import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const NAV_ITEMS = [
  { path: '/', label: 'الرئيسية', icon: '⬛' },
  { path: '/settings', label: 'الإعدادات', icon: '⚙️', adminOnly: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  // Derive user initials for avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">H</div>
        <span className="sidebar-brand-name">نظام HHA</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">القائمة الرئيسية</span>
        {NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin' || user?.role === 'developer').map(item => (
          <button
            key={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <span className="link-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer with user info and logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username}</div>
            <div className="sidebar-user-role">{user?.role === 'developer' ? 'مطور النظام' : user?.role === 'admin' ? 'مدير النظام' : user?.role === 'accountant' ? 'محاسب' : 'مستخدم'}</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="تسجيل خروج"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  );
}
