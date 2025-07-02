// src/components/instructor/ClassSelector.tsx
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, Calendar } from "lucide-react";

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

interface ClassSelectorProps {
  onClassSelect: (classData: InstructorClass) => void;
  selectedClass: InstructorClass | null;
  onShowAllClasses: () => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  onClassSelect,
  selectedClass,
  onShowAllClasses
}) => {
  const [classes, setClasses] = useState<InstructorClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInstructorClasses();
  }, []);

  const loadInstructorClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/api/instructors/classes');
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error loading instructor classes:', err);
      setError('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button 
            variant="outline" 
            onClick={loadInstructorClasses}
            className="mt-2 bg-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Classes Found</h3>
          <p>You are not currently enrolled as an instructor in any classes.</p>
          <p className="text-sm mt-2">Contact your administrator to be added to classes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Your Classes</h2>
          <p className="text-gray-600">Select a class to view class-specific data</p>
        </div>
        
        {selectedClass && (
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Currently viewing: {selectedClass.course_code} - Section {selectedClass.section_code}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShowAllClasses}
              className="bg-white"
            >
              View All Classes
            </Button>
          </div>
        )}
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classData) => (
          <Card 
            key={`${classData.class_id}-${classData.section_id}`}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 ${
              selectedClass?.section_id === classData.section_id 
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onClassSelect(classData)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {classData.course_code}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {classData.title}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Section {classData.section_code}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Term Info */}
                {classData.term && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{classData.term.name} ({classData.term.code})</span>
                  </div>
                )}
                
                {/* Statistics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-lg font-semibold">{classData.student_count}</div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-lg font-semibold">{classData.case_count}</div>
                      <div className="text-xs text-gray-500">Cases</div>
                    </div>
                  </div>
                </div>
                
                {/* Institution */}
                {classData.institution && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {classData.institution}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassSelector;