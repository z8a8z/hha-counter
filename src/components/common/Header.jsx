import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="app-topbar">
        <div className="header-brand">
          <h1>HHA</h1>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="header-nav" style={{ visibility: user ? 'visible' : 'hidden' }}>
          <Link to="/" className="nav-link">الرئيسية</Link>
          {user?.role === 'admin' && (
            <Link to="/settings" className="nav-link">الإعدادات</Link>
          )}
          <button onClick={handleLogout} className="btn btn-outline">
            تسجيل خروج ({user?.username})
          </button>
        </nav>

        {/* Mobile Hamburger menu button */}
        <button 
          className="menu-btn" 
          onClick={() => setIsDrawerOpen(true)}
          style={{ visibility: user ? 'visible' : 'hidden' }}
        >
          ☰
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} 
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Mobile Drawer */}
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h1>HHA</h1>
          <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>✕</button>
        </div>
        <nav className="drawer-nav">
          <Link to="/" className="nav-link" onClick={() => setIsDrawerOpen(false)}>الرئيسية</Link>
          {user?.role === 'admin' && (
            <Link to="/settings" className="nav-link" onClick={() => setIsDrawerOpen(false)}>الإعدادات</Link>
          )}
          <button 
            onClick={() => { setIsDrawerOpen(false); handleLogout(); }} 
            className="btn btn-outline" 
            style={{ marginTop: '1rem', width: '100%' }}
          >
            تسجيل خروج ({user?.username})
          </button>
        </nav>
      </div>
    </>
  );
}
