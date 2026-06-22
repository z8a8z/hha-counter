import { createContext, useContext, useState, useEffect } from 'react';
import { login as dbLogin } from '../lib/database.js';
import { hashPassword } from '../lib/auth.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if user is in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('hha_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const hash = await hashPassword(password);
    const { data, error } = await dbLogin(username, hash);
    if (error) {
      return { success: false, error };
    }
    setUser(data);
    localStorage.setItem('hha_user', JSON.stringify(data));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hha_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
