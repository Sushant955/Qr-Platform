import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('qr_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qr_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('qr_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('qr_token');
        localStorage.removeItem('qr_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('qr_token', data.token);
    localStorage.setItem('qr_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await client.post('/auth/register', { name, email, password });
    localStorage.setItem('qr_token', data.token);
    localStorage.setItem('qr_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('qr_token');
    localStorage.removeItem('qr_user');
    setUser(null);
  }

  function updateUser(updated) {
    setUser(updated);
    localStorage.setItem('qr_user', JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
