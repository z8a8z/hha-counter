import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import Login from './components/auth/Login.jsx';
import Home from './components/Home.jsx';
import Settings from './components/admin/Settings.jsx';
import { getPrintSettings } from './lib/database.js';
import './App.css';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Main layout with sidebar
function AppShell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    // Render login without sidebar
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      {user.role !== 'scale_employee' && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Mobile overlay */}
      {user.role !== 'scale_employee' && (
        <div
          className={`drawer-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/images/printingslogo.png" alt="Logo" style={{ maxHeight: '44px', maxWidth: '44px', objectFit: 'contain', borderRadius: '4px', background: '#fff', padding: '1px' }} />
            {user.role === 'scale_employee' && (
              <span className="scale-welcome-text" style={{ fontSize: '0.92rem', color: 'var(--txt-secondary)', fontWeight: 500, marginRight: '10px' }}>
                مرحباً، {user.username} (موظف ميزان)
              </span>
            )}
          </div>
          <div className="topbar-actions">
            {user.role === 'scale_employee' ? (
              <button
                className="btn btn-danger btn-small"
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <span>تسجيل الخروج</span>
                <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>↩</span>
              </button>
            ) : (
              <button
                className="menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة"
              >
                ☰
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="app-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
