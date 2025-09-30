import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  permissions?: string[];
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ requiresTwoFactor?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  enableTwoFactor: (code?: string) => Promise<{ message: string }>;
  disableTwoFactor: (code?: string) => Promise<{ message: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, loading: false, user: action.payload, error: null };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'AUTH_LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: false,
    error: null,
  });

  // Restore user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('wastewise_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, []);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password, 
        ...(twoFactorCode && { twoFactorCode })
      });
      
      if (data.requiresTwoFactor) {
        dispatch({ type: 'AUTH_ERROR', payload: data.message });
        return { requiresTwoFactor: true };
      }
      
      localStorage.setItem('wastewise_user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'AUTH_SUCCESS', payload: data });
      return {};
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      localStorage.setItem('wastewise_user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'AUTH_SUCCESS', payload: data });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  };

  const enableTwoFactor = async (code?: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/enable-2fa`, 
        code ? { code } : {}
      );
      
      // If 2FA was successfully enabled, update user data
      if (code && state.user) {
        const updatedUser = { ...state.user, twoFactorEnabled: true };
        localStorage.setItem('wastewise_user', JSON.stringify(updatedUser));
        dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to enable 2FA';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const disableTwoFactor = async (code?: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/disable-2fa`, 
        code ? { code } : {}
      );
      
      // If 2FA was successfully disabled, update user data
      if (code && state.user) {
        const updatedUser = { ...state.user, twoFactorEnabled: false };
        localStorage.setItem('wastewise_user', JSON.stringify(updatedUser));
        dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to disable 2FA';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('wastewise_user');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ 
      ...state, 
      login, 
      register, 
      enableTwoFactor, 
      disableTwoFactor, 
      logout, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
