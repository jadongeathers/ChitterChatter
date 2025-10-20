// src/components/student/StudentClassAwareLayout.tsx
import React, { useState } from 'react';
import { useStudentClass } from '@/contexts/StudentClassContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, User, Calendar, Settings } from 'lucide-react';
import StudentClassSelector from './StudentClassSelector';

interface StudentClassAwareLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  showClassSelector?: boolean;
}

const StudentClassAwareLayout: React.FC<StudentClassAwareLayoutProps> = ({ 
  children, 
  title, 
  description,
  showClassSelector = false 
}) => {
  const { 
    availableClasses, 
    selectedClass, 
    selectClass, 
    isLoading, 
    error,
    hasInitialized,
    classDisplayName 
  } = useStudentClass();
  
  const [showFullClassSelector, setShowFullClassSelector] = useState(showClassSelector);

  // Show loading state while initializing (but only on first load)
  if (isLoading && !hasInitialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Show full class selector if:
  // 1. Explicitly requested, OR
  // 2. No class is selected AND there are multiple classes available AND we've initialized
  const shouldShowClassSelector = showFullClassSelector || 
    (hasInitialized && !selectedClass && availableClasses.length > 1);

  if (shouldShowClassSelector) {
    return (
      <StudentClassSelector
        onClassSelect={(classData) => {
          console.log('StudentClassSelector - selecting class:', classData);
          selectClass(classData);
          setShowFullClassSelector(false);
        }}
        selectedClass={selectedClass}
        onShowAllClasses={() => {
          console.log('StudentClassSelector - showing all classes');
          selectClass(null);
          setShowFullClassSelector(false);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">Error: {error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-2 bg-white">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Enhanced Header with Class Selection */}
      <header className="mb-6">
        {/* Main Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p>
          </div>
          
          {/* Class Selection Controls - Single Dropdown */}
          {availableClasses.length > 0 && (
            <div className="flex-shrink-0">
              {/* Primary Class Selector Dropdown */}
              <Select
                value={selectedClass?.section_id.toString() || 'all'}
                onValueChange={(value) => {
                  console.log('Select dropdown - changing to:', value);
                  if (value === 'all') {
                    selectClass(null);
                  } else if (value === 'manage') {
                    setShowFullClassSelector(true);
                  } else {
                    const classData = availableClasses.find(c => c.section_id.toString() === value);
                    if (classData) {
                      console.log('Select dropdown - found class:', classData);
                      selectClass(classData);
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-64 bg-white border-slate-300 hover:border-slate-400 transition-colors">
                  <SelectValue>
                    <div className="flex items-center space-x-2 min-w-0">
                      {selectedClass ? (
                        <>
                          <GraduationCap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{selectedClass.course_code} - Section {selectedClass.section_code}</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="truncate">All Classes</span>
                        </>
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full min-w-[280px]">
                  {/* All Classes Option */}
                  <SelectItem value="all" className="py-3">
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span className="font-medium">All Classes</span>
                    </div>
                  </SelectItem>
                  
                  {/* Individual Classes */}
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.section_id} value={cls.section_id.toString()} className="py-3">
                      <div className="flex items-center justify-between w-full min-w-0">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <GraduationCap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {cls.course_code} - Section {cls.section_code}
                            </div>
                            {cls.term && (
                          <div className="text-xs text-slate-500 truncate">
                                {cls.term.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                          <div className="flex items-center space-x-1 text-xs text-slate-500">
                            <User className="h-3 w-3" />
                            <span>{cls.instructor_name}</span>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Manage Classes Option */}
                  {availableClasses.length > 4 && (
                    <>
                      <div className="border-t my-1"></div>
                      <SelectItem value="manage" className="py-3">
                        <div className="flex items-center space-x-3">
                          <Settings className="h-4 w-4 text-slate-600 flex-shrink-0" />
                          <span className="font-medium">Manage Classes...</span>
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <hr className="border-t border-slate-200" />
      </header>

      {/* Page Content */}
      {children}
    </div>
  );
};

export default StudentClassAwareLayout;
