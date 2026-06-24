import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { success, error: loginError } = await login(username, password);
    setIsSubmitting(false);

    if (success) {
      navigate('/');
    } else {
      setError(loginError || 'فشل في تسجيل الدخول');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">H</div>
            <span className="login-logo-text">HHA</span>
          </div>

          <h2>مرحباً بعودتك</h2>
          <p className="login-subtitle">أدخل بياناتك للوصول إلى النظام</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">اسم المستخدم</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول ←'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
