// AuthContext.tsx - Enhanced to manage all auth state
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';

type UserRole = "student" | "instructor" | "master";

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;
  user: any;
  login: (role: UserRole, token: string, userData?: any) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetchWithAuth("/api/auth/me");
      
      if (!response.ok) {
        // Token is invalid, clear everything
        logout();
        return;
      }

      const userData = await response.json();
      const userRole: UserRole = userData.is_master ? "master" : (userData.is_student ? "student" : "instructor");
      
      setIsAuthenticated(true);
      setRole(userRole);
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userRole: UserRole, token: string, userData?: any) => {
    // Store token first
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', userRole);
    
    // Update state
    setIsAuthenticated(true);
    setRole(userRole);
    setUser(userData);
    setIsLoading(false);
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('is_master');
    localStorage.removeItem('instructor_selected_class');
    localStorage.removeItem('student_selected_class');
    
    // Reset state
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      role, 
      isLoading, 
      user, 
      login, 
      logout, 
      checkAuthStatus 
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