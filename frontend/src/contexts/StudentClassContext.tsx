// src/contexts/StudentClassContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithAuth } from "@/utils/api";

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
  // State
  availableClasses: StudentClass[];
  selectedClass: StudentClass | null;
  isLoading: boolean;
  error: string | null;
  hasInitialized: boolean;
  
  // Actions
  selectClass: (classData: StudentClass | null) => void;
  refreshClasses: () => Promise<void>;
  
  // Computed properties
  isClassSelected: boolean;
  classDisplayName: string;
  apiParams: URLSearchParams;
}

const StudentClassContext = createContext<StudentClassContextType | undefined>(undefined);

interface StudentClassProviderProps {
  children: ReactNode;
  userRole: string;
}

export const StudentClassProvider: React.FC<StudentClassProviderProps> = ({ children, userRole }) => {
  const [availableClasses, setAvailableClasses] = useState<StudentClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Only load classes for students
  const shouldLoadClasses = userRole === 'student';

  // Storage keys
  const SELECTED_CLASS_KEY = 'student_selected_class';

  const loadClasses = async () => {
    // Don't load if not a student OR if userRole is empty (auth not complete)
    if (!shouldLoadClasses || !userRole) {
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }

    try {
      // Only show loading for the initial load, not subsequent refreshes
      if (!hasInitialized) {
        setIsLoading(true);
      }
      setError(null);
      
      // Add a small delay to ensure auth is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetchWithAuth('/api/students/classes');
      
      if (!response.ok) {
        // If unauthorized, clear saved class selection
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem(SELECTED_CLASS_KEY);
          setSelectedClass(null);
        }
        throw new Error(`Failed to load classes: ${response.status}`);
      }
      
      const classes = await response.json();
      setAvailableClasses(classes);
      
      // Try to restore previously selected class
      const savedClassId = localStorage.getItem(SELECTED_CLASS_KEY);
      let classToSelect: StudentClass | null = null;
      
      if (savedClassId) {
        classToSelect = classes.find((c: StudentClass) => c.section_id.toString() === savedClassId) || null;
      }
      
      // Auto-select class if there's only one and none is saved
      if (!classToSelect && classes.length === 1) {
        classToSelect = classes[0];
      }
      
      if (classToSelect) {
        setSelectedClass(classToSelect);
        localStorage.setItem(SELECTED_CLASS_KEY, classToSelect.section_id.toString());
      }
      
      setHasInitialized(true);
      
    } catch (err) {
      console.error('Error loading student classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load classes');
      setHasInitialized(true);
    } finally {
      // Only set loading to false if this was an initial load
      if (!hasInitialized) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Only attempt to load classes when userRole is properly set
    if (userRole) {
      loadClasses();
    } else {
      // If no userRole yet, don't show loading
      setIsLoading(false);
      setHasInitialized(false);
    }
  }, [shouldLoadClasses, userRole]); // Add userRole as dependency

  const selectClass = (classData: StudentClass | null) => {
    console.log('Selecting class:', classData); // Debug log
    setSelectedClass(classData);
    
    // Persist selection to localStorage
    if (classData) {
      localStorage.setItem(SELECTED_CLASS_KEY, classData.section_id.toString());
    } else {
      localStorage.removeItem(SELECTED_CLASS_KEY);
    }
  };

  const refreshClasses = async () => {
    await loadClasses();
  };

  // Computed properties
  const isClassSelected = selectedClass !== null;
  const classDisplayName = selectedClass 
    ? `${selectedClass.course_code} - Section ${selectedClass.section_code}`
    : 'All Classes';

  // Generate API parameters based on selected class
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