// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';

type UserRole = "student" | "instructor" | "master";

// Define the User object structure for better type safety
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_student: boolean;
  is_instructor: boolean;
  is_master: boolean;
  profile_picture: string | null;
  profile_picture_url: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;
  user: User | null; // Use the User interface for better typing
  login: (role: UserRole, token: string, userData?: any) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  refetchUser?: () => Promise<void>; // 👈 --- ADD THIS FUNCTION
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // To prevent a re-render loop if called multiple times, ensure we only set loading true once.
    if (!isLoading) setIsLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetchWithAuth("/api/auth/me");
      
      if (!response.ok) {
        logout(); // This sets loading to false
        return;
      }

      const userData: User = await response.json();
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

  // 👈 --- DEFINE THE REFETCH FUNCTION ---
  // It simply re-runs the authentication check to get the latest user data.
  const refetchUser = async () => {
    await checkAuthStatus();
  };

  const login = (userRole: UserRole, token: string, userData?: any) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', userRole);
    
    setIsAuthenticated(true);
    setRole(userRole);
    setUser(userData);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user'); // Also remove the user object
    localStorage.removeItem('instructor_selected_class');
    localStorage.removeItem('student_selected_class');
    
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
      checkAuthStatus,
      refetchUser // 👈 --- PASS IT TO THE PROVIDER'S VALUE
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