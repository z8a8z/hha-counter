import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import Login from './components/auth/Login.jsx';
import Home from './components/Home.jsx';
import Settings from './components/admin/Settings.jsx';
import './App.css';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Main layout with sidebar
function AppShell() {
  const { user } = useAuth();
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      <div
        className={`drawer-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="app-main">
        {/* Topbar (mobile only brand + hamburger) */}
        <header className="app-topbar">
          <span className="topbar-title">HHA</span>
          <div className="topbar-actions">
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة"
            >
              ☰
            </button>
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
