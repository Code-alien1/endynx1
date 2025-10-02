import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import apiService, { User, LoginCredentials, RegisterData } from '../services/api';
import { getRoleBasedRoute } from '../utils/roleRedirect';
import type { Href } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  getRoleRoute: () => Href;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 AuthContext: Checking authentication status...');
      const isAuth = await apiService.isAuthenticated();
      if (isAuth) {
        console.log('✅ AuthContext: User is authenticated, fetching profile...');
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
        console.log('✅ AuthContext: User profile loaded:', currentUser.email);
      } else {
        console.log('❌ AuthContext: User is not authenticated');
        // Ensure user is null if not authenticated
        setUser(null);
      }
    } catch (error: any) {
      console.error('❌ AuthContext: Auth check failed:', error);
      // Only clear tokens if it's a real auth failure, not a network error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🧹 AuthContext: Clearing tokens due to auth failure');
        setUser(null);
        await apiService.logout();
      } else {
        console.log('⚠️ AuthContext: Network error, keeping current state');
        // For network errors, don't clear user state if we had a user
        // This prevents logout loops during temporary network issues
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      // Ensure user is set immediately after successful login
      setUser(response.user);
      
      // Force a small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Login successful, user set:', response.user.email, 'Role:', response.user.role);
      
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error: Please check your connection and ensure the backend server is running.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      setUser(response.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error: Please check your connection and ensure the backend server is running.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateProfile(userData);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed';
      Alert.alert('Update Error', errorMessage);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 AuthContext: Refreshing user profile...');
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
      console.log('✅ AuthContext: User profile refreshed:', currentUser.email);
    } catch (error: any) {
      console.error('❌ AuthContext: User refresh error:', error);
      // Only logout on auth errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🧹 AuthContext: Logging out due to auth error during refresh');
        await logout();
      } else {
        console.log('⚠️ AuthContext: Network error during refresh, keeping current state');
      }
    }
  };

  const getRoleRoute = (): Href => {
    if (!user) return '/(auth)/login' as Href;
    return getRoleBasedRoute(user);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    getRoleRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
