import React, { createContext, useState, useEffect, useContext } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://llmapi.inferia.ai/api4000';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // try read from localStorage
    try {
      const raw = localStorage.getItem('inferia_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user);
        setAccessToken(parsed.accessToken);
      }
    } catch (err) {}
  }, []);

  // try refresh on mount (if refresh cookie exists on server)
  useEffect(() => {
    async function tryRefresh() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.accessToken) {
            setAccessToken(data.accessToken);
            // keep existing user in localStorage if present
            const raw = localStorage.getItem('inferia_auth');
            const parsed = raw ? JSON.parse(raw) : {};
            parsed.accessToken = data.accessToken;
            localStorage.setItem('inferia_auth', JSON.stringify(parsed));
          }
        } else {
          // clear local state if refresh failed
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('inferia_auth');
        }
      } catch (err) {
        // ignore
      }
    }
    tryRefresh();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('inferia_auth', JSON.stringify({ user, accessToken }));
    } else {
      localStorage.removeItem('inferia_auth');
    }
  }, [user, accessToken]);

  async function signup({ email, password, name }) {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password, name })
    });
    return res.json();
  }

  async function login({ email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password })
    });
    return res.json();
  }

  async function verifyOtp({ email, otp, token }) {
    const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, otp, token })
    });
    const data = await res.json();
    if (data && data.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore network errors
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('inferia_auth');
  }

  // refresh helper exposed to consumers
  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.accessToken) {
        setAccessToken(data.accessToken);
        const raw = localStorage.getItem('inferia_auth');
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.accessToken = data.accessToken;
        localStorage.setItem('inferia_auth', JSON.stringify(parsed));
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  // Auto-refresh interval (every 13 minutes) to keep access token alive while app is open
  useEffect(() => {
    const interval = setInterval(() => {
      if (accessToken) {
        refresh();
      }
    }, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, signup, login, verifyOtp, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  return useContext(AuthContext);
}
