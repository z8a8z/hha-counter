import { createContext, useContext, useState, useEffect } from 'react';
import { login as dbLogin, getUserPermissions } from '../lib/database.js';
import { hashPassword } from '../lib/auth.js';

const AuthContext = createContext();

const ALL_TABS = ['purchases', 'ready', 'orders', 'withdraw', 'damaged', 'storage', 'report'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // On mount, check if user is in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('hha_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Load permissions for restored session
        loadPermissions(parsed);
      } catch {
        // Corrupt localStorage — clear and start fresh
        localStorage.removeItem('hha_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadPermissions = async (userData) => {
    if (!userData) {
      setAllowedTabs([]);
      setLoading(false);
      return;
    }
    // Developer always gets all tabs
    if (userData.role === 'developer') {
      setAllowedTabs(ALL_TABS);
      setLoading(false);
      return;
    }
    // Scale employee always gets only 'ready' tab
    if (userData.role === 'scale_employee') {
      setAllowedTabs(['ready']);
      setLoading(false);
      return;
    }
    // Fetch per-user permissions
    const { data, error } = await getUserPermissions(userData.id);
    if (!error && data) {
      setAllowedTabs(data);
    } else {
      setAllowedTabs([]);
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const hash = await hashPassword(password);
    const { data, error } = await dbLogin(username, hash);
    if (error) {
      return { success: false, error };
    }
    setUser(data);
    localStorage.setItem('hha_user', JSON.stringify(data));
    await loadPermissions(data);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setAllowedTabs([]);
    localStorage.removeItem('hha_user');
  };

  // Allows re-fetching permissions after an admin/developer modifies them
  const refreshPermissions = async () => {
    if (user) {
      await loadPermissions(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, allowedTabs, login, logout, loading, refreshPermissions }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
