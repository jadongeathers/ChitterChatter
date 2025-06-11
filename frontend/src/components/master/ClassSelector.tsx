// src/components/master/ClassSelector.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Import Badge if you have it in your UI library
import { fetchWithAuth } from "@/utils/api";
import { Class } from '@/services/masterService';

interface ClassWithSectionInfo extends Class {
  hasActiveSections: boolean;
  sectionCount: number;
}

interface ClassSelectorProps {
  institutionId: number;
  termId: number;
  onSelect: (cls: Class) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ 
  institutionId, 
  termId,
  onSelect, 
  onSuccess, 
  onError 
}) => {
  const [classes, setClasses] = useState<ClassWithSectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClass, setNewClass] = useState({
    course_code: '',
    title: '',
  });

  useEffect(() => {
    if (institutionId) {
      loadClasses();
    }
  }, [institutionId, termId]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      
      // Get all classes for the institution
      const classResponse = await fetchWithAuth(`/api/master/classes?institution_id=${institutionId}`);
      
      if (!classResponse.ok) {
        throw new Error(`Server returned ${classResponse.status}: ${classResponse.statusText}`);
      }
      
      const classes = await classResponse.json();
      
      // For each class, check if it has sections in the selected term
      const classesWithSectionInfo = await Promise.all(
        classes.map(async (cls: Class) => {
          try {
            const sectionsResponse = await fetchWithAuth(`/api/master/sections?class_id=${cls.id}`);
            
            if (!sectionsResponse.ok) {
              throw new Error(`Failed to fetch sections for class ${cls.id}`);
            }
            
            const sections = await sectionsResponse.json();
            const termSections = sections.filter((section: any) => section.term_id === termId);
            
            return {
              ...cls,
              hasActiveSections: termSections.length > 0,
              sectionCount: termSections.length
            };
          } catch (err) {
            console.error(`Error fetching sections for class ${cls.id}:`, err);
            return {
              ...cls,
              hasActiveSections: false,
              sectionCount: 0
            };
          }
        })
      );
      
      setClasses(classesWithSectionInfo);
    } catch (err) {
      onError('Failed to load classes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClass(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClass = async () => {
    if (!newClass.course_code || !newClass.title) {
      onError('All fields are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await fetchWithAuth('/api/master/classes', {
        method: 'POST',
        body: JSON.stringify({
          ...newClass,
          institution_id: institutionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const createdClass = await response.json();
      
      // Refresh the class list to include the new class
      loadClasses();
      
      setNewClass({
        course_code: '',
        title: '',
      });
      setIsAddingNew(false);
      onSuccess('Class added successfully');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add class');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && classes.length === 0) {
    return <div className="py-4">Loading classes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <p>No classes available. Add your first class.</p>
        ) : (
          classes.map(cls => (
            <Card 
              key={cls.id} 
              className={`p-4 hover:border-blue-400 transition-colors cursor-pointer ${
                !cls.hasActiveSections ? 'opacity-70 border-gray-300 bg-gray-50' : ''
              }`}
              onClick={() => onSelect(cls)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{cls.course_code}</h3>
                  <p className="text-sm text-gray-600">{cls.title}</p>
                </div>
                {cls.hasActiveSections ? (
                  <Badge className="bg-green-100 text-green-800 border border-green-200">
                    {cls.sectionCount} {cls.sectionCount === 1 ? 'Section' : 'Sections'}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 border border-gray-200">
                    No Sections
                  </Badge>
                )}
              </div>
              {!cls.hasActiveSections && (
                <p className="text-xs text-gray-500 mt-2">
                  This class has no sections in the selected term.
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {isAddingNew ? (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <h3 className="font-medium">Add New Class</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="text"
              name="course_code"
              placeholder="Course Code (e.g. CS101)"
              value={newClass.course_code}
              onChange={handleInputChange}
            />
            <Input
              type="text"
              name="title"
              placeholder="Class Title"
              value={newClass.title}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddClass} 
              disabled={isSubmitting || !newClass.course_code || !newClass.title}
            >
              {isSubmitting ? 'Adding...' : 'Save'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingNew(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAddingNew(true)}>
          Add New Class
        </Button>
      )}
    </div>
  );
};

export default ClassSelector;