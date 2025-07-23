/*
QuantEnergX MVP - Authentication Context
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

React context for managing user authentication state, JWT tokens,
and role-based access control throughout the application.
*/

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  language: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  switchLanguage: (language: string) => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  language?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('quantenergx_token');
        const storedUser = localStorage.getItem('quantenergx_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Configure axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify token is still valid
          await verifyToken(storedToken);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout(); // Clear invalid auth state
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data) {
        setUser(response.data);
        return true;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
    return false;
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email,
        password,
        remember_me: rememberMe
      });

      const { access_token, user_info } = response.data;

      // Store auth data
      localStorage.setItem('quantenergx_token', access_token);
      localStorage.setItem('quantenergx_user', JSON.stringify(user_info));

      // Update state
      setToken(access_token);
      setUser(user_info);

      // Configure axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, userData);
      
      const { access_token, user_info } = response.data;

      // Store auth data
      localStorage.setItem('quantenergx_token', access_token);
      localStorage.setItem('quantenergx_user', JSON.stringify(user_info));

      // Update state
      setToken(access_token);
      setUser(user_info);

      // Configure axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Redirect to onboarding
      router.push('/onboarding');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Clear auth data
    localStorage.removeItem('quantenergx_token');
    localStorage.removeItem('quantenergx_user');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear axios defaults
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to login
    router.push('/auth/login');
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('quantenergx_user', JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    
    // Super admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    return user.permissions.includes(permission);
  };

  const switchLanguage = async (language: string): Promise<void> => {
    if (user) {
      try {
        // Update user language preference
        updateUser({ language });
        
        // In a real app, this might call an API to persist the change
        console.log(`Language switched to: ${language}`);
        
        // Reload page to apply new language
        window.location.reload();
      } catch (error) {
        console.error('Language switch error:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    switchLanguage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};