import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, setToken, removeToken } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from API
  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const result = await authAPI.getCurrentUser();
      if (result.success) {
        // Map user_type to role for frontend consistency
        const userData = {
          ...result.data,
          role: result.data.user_type || result.data.role,
        };
        setUser(userData);
      } else {
        // Token might be invalid, clear it
        removeToken();
        setUser(null);
      }
    } catch (error) {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Load user from API on mount if token exists
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password, role) => {
    try {
      let result;
      if (role === 'doctor') {
        result = await authAPI.loginDoctor(email, password);
      } else if (role === 'patient') {
        result = await authAPI.loginPatient(email, password);
      } else {
        return { success: false, error: 'Invalid role specified' };
      }

      if (result.success && result.data.access_token) {
        // Store token
        setToken(result.data.access_token);
        
        // Fetch user info
        const userResult = await authAPI.getCurrentUser();
        if (userResult.success) {
          const userData = {
            ...userResult.data,
            role: userResult.data.user_type || userResult.data.role,
          };
          setUser(userData);
          return { success: true, user: userData };
        }
      }

      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'An error occurred during login' };
    }
  };

  const signup = async (userData) => {
    try {
      let result;
      if (userData.role === 'doctor') {
        result = await authAPI.signupDoctor(userData);
      } else if (userData.role === 'patient') {
        result = await authAPI.signupPatient(userData);
      } else {
        return { success: false, error: 'Invalid role specified' };
      }

      if (result.success && result.data.access_token) {
        // Store token
        setToken(result.data.access_token);
        
        // Fetch user info
        const userResult = await authAPI.getCurrentUser();
        if (userResult.success) {
          const userData = {
            ...userResult.data,
            role: userResult.data.user_type || userResult.data.role,
          };
          setUser(userData);
          return { success: true, user: userData };
        }
      }

      return { success: false, error: result.error || 'Signup failed' };
    } catch (error) {
      return { success: false, error: error.message || 'An error occurred during signup' };
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
  };

  const isAuthenticated = () => {
    return user !== null && getToken() !== null;
  };

  const hasRole = (role) => {
    // Check both role and user_type for compatibility
    return user?.role === role || user?.user_type === role;
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated,
    hasRole,
    loading,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
