// src/contexts/ClassContext.tsx - Clean version without hacks
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export interface InstructorClass {
  class_id: number;
  section_id: number;
  course_code: string;
  title: string;
  section_code: string;
  student_count: number;
  case_count: number;
  institution: string;
  term: {
    id: number;
    name: string;
    code: string;
  } | null;
}

interface ClassContextType {
  availableClasses: InstructorClass[];
  selectedClass: InstructorClass | null;
  isLoading: boolean;
  error: string | null;
  hasInitialized: boolean;
  selectClass: (cls: InstructorClass | null) => void;
  refreshClasses: () => Promise<void>;
  isClassSelected: boolean;
  classDisplayName: string;
  apiParams: URLSearchParams;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{
  children: ReactNode;
  userRole: string;
}> = ({ children, userRole }) => {
  const { isAuthenticated } = useAuth(); // Use auth context
  const [availableClasses, setAvailableClasses] = useState<InstructorClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<InstructorClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only load classes if user is authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetchWithAuth('/api/instructors/classes');
        if (!res.ok) {
          // If token expired/invalid, clear saved class and show error
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('instructor_selected_class');
            setSelectedClass(null);
          }
          throw new Error(`Status ${res.status}`);
        }

        const classes = (await res.json()) as InstructorClass[];
        setAvailableClasses(classes);

        const savedId = localStorage.getItem('instructor_selected_class');
        let toSelect: InstructorClass | null = null;
        if (savedId) {
          toSelect = classes.find((c) => c.section_id.toString() === savedId) || null;
        }
        if (!toSelect && classes.length === 1) {
          toSelect = classes[0];
        }
        if (toSelect) {
          setSelectedClass(toSelect);
          localStorage.setItem('instructor_selected_class', toSelect.section_id.toString());
        }
      } catch (err) {
        console.error('ClassProvider load error:', err);
        setError((err as Error).message || 'Failed to load classes');
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    load();
  }, [isAuthenticated]); // Re-run when authentication status changes

  const selectClass = (cls: InstructorClass | null) => {
    setSelectedClass(cls);
    if (cls) {
      localStorage.setItem('instructor_selected_class', cls.section_id.toString());
    } else {
      localStorage.removeItem('instructor_selected_class');
    }
  };

  const refreshClasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/instructors/classes');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const classes = (await res.json()) as InstructorClass[];
      setAvailableClasses(classes);
    } catch (err) {
      console.error('ClassProvider refresh error:', err);
      setError((err as Error).message || 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
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

  const value: ClassContextType = {
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

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
};

export const useClass = () => {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error('useClass must be inside ClassProvider');
  return ctx;
};