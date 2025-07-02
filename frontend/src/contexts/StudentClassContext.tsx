import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithAuth } from "@/utils/api";
import { useAuth } from './AuthContext';

export interface StudentClass {
  class_id: number;
  section_id: number;
  course_code: string;
  title: string;
  section_code: string;
  instructor_name: string;
  institution: string;
  term: {
    id: number;
    name: string;
    code: string;
  } | null;
}

interface StudentClassContextType {
  availableClasses: StudentClass[];
  selectedClass: StudentClass | null;
  isLoading: boolean;
  error: string | null;
  hasInitialized: boolean;
  selectClass: (classData: StudentClass | null) => void;
  refreshClasses: () => Promise<void>;
  isClassSelected: boolean;
  classDisplayName: string;
  apiParams: URLSearchParams;
}

const StudentClassContext = createContext<StudentClassContextType | undefined>(undefined);

// The provider no longer needs to accept any props.
export const StudentClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get authentication state directly from the AuthContext.
  const { role, isAuthenticated, isLoading: authIsLoading } = useAuth();
  
  const [availableClasses, setAvailableClasses] = useState<StudentClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const SELECTED_CLASS_KEY = 'student_selected_class';

  useEffect(() => {
    // This effect now has a clear guard clause. It will only proceed if
    // authentication is complete, the user is logged in, and their role is 'student'.
    if (authIsLoading || !isAuthenticated || role !== 'student') {
      setIsLoading(false);
      setHasInitialized(true); // Mark as ready, even if there's nothing to load.
      return;
    }

    const loadClasses = async () => {
      if (!hasInitialized) setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchWithAuth('/api/students/classes');
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem(SELECTED_CLASS_KEY);
            setSelectedClass(null);
          }
          throw new Error(`Failed to load classes: ${response.status}`);
        }
        
        const classes = await response.json();
        setAvailableClasses(classes);
        
        const savedClassId = localStorage.getItem(SELECTED_CLASS_KEY);
        let classToSelect: StudentClass | null = null;
        
        if (savedClassId) {
          classToSelect = classes.find((c: StudentClass) => c.section_id.toString() === savedClassId) || null;
        }
        
        if (!classToSelect && classes.length === 1) {
          classToSelect = classes[0];
        }
        
        if (classToSelect) {
          setSelectedClass(classToSelect);
          localStorage.setItem(SELECTED_CLASS_KEY, classToSelect.section_id.toString());
        }
        
      } catch (err) {
        console.error('Error loading student classes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load classes');
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    loadClasses();
  }, [isAuthenticated, authIsLoading, role, hasInitialized]); // Dependency array is now robust.

  const selectClass = (classData: StudentClass | null) => {
    setSelectedClass(classData);
    if (classData) {
      localStorage.setItem(SELECTED_CLASS_KEY, classData.section_id.toString());
    } else {
      localStorage.removeItem(SELECTED_CLASS_KEY);
    }
  };

  const refreshClasses = async () => {
    // Re-run the loading logic, but hasInitialized will be true now.
    setHasInitialized(false);
  };

  const isClassSelected = selectedClass !== null;
  const classDisplayName = selectedClass 
    ? `${selectedClass.course_code} - Section ${selectedClass.section_code}`
    : 'All Classes';

  const apiParams = new URLSearchParams();
  if (selectedClass) {
    apiParams.append('class_id', selectedClass.class_id.toString());
    apiParams.append('section_id', selectedClass.section_id.toString());
  }

  const value: StudentClassContextType = {
    availableClasses,
    selectedClass,
    isLoading,
    error,
    hasInitialized,
    selectClass,
    refreshClasses,
    isClassSelected,
    classDisplayName,
    apiParams,
  };

  return (
    <StudentClassContext.Provider value={value}>
      {children}
    </StudentClassContext.Provider>
  );
};

export const useStudentClass = () => {
  const context = useContext(StudentClassContext);
  if (context === undefined) {
    throw new Error('useStudentClass must be used within a StudentClassProvider');
  }
  return context;
};