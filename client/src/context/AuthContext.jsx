import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.warn('Session expired or invalid token:', error.message);
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  /**
   * Log in user with email & password
   */
  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(response.data?.message || 'Authentication failed');
  }

  /**
   * Register a new citizen
   */
  async function register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(response.data?.message || 'Registration failed');
  }

  /**
   * Log out current user
   */
  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }

  /**
   * Update profile details
   */
  async function updateProfile(data) {
    const response = await api.put('/auth/profile', data);
    if (response.data?.success) {
      setUser((prev) => ({ ...prev, ...response.data.data }));
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Profile update failed');
  }

  /**
   * Change password
   */
  async function changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  const role = user?.role?.toLowerCase();

  const value = {
    user,
    token,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isOfficer: role === 'officer',
    isCitizen: role === 'citizen',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
