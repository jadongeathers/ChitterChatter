// components/instructor/CaseCreation/shared/ProgressHeader.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

interface PracticeCase {
  id: number;
  title?: string;
  description?: string;
  target_language?: string;
  situation_instructions?: string;
  curricular_goals?: string;
  behavioral_guidelines?: string;
  proficiency_level?: string;
  accessible_on?: string;
  min_time?: number;
  max_time?: number;
  is_draft?: boolean;
  published?: boolean;
}

interface ProgressHeaderProps {
  practiceCase: PracticeCase | null;
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  practiceCase,
  isAutoSaving,
  hasUnsavedChanges
}) => {
  const getCompletionPercentage = () => {
    const fields = [
      practiceCase?.title,
      practiceCase?.description,
      practiceCase?.target_language,
      practiceCase?.situation_instructions,
      practiceCase?.curricular_goals,
      practiceCase?.behavioral_guidelines,
      practiceCase?.proficiency_level,
      practiceCase?.accessible_on,
      practiceCase?.min_time,
      practiceCase?.max_time
    ];
    
    const completed = fields.filter(field => field && field.toString().trim()).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Practice Case Progress</CardTitle>
              <CardDescription className="text-blue-700">
                {completionPercentage}% complete
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAutoSaving && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                Auto-saving...
              </Badge>
            )}
            {hasUnsavedChanges && !isAutoSaving && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                Unsaved Changes
              </Badge>
            )}
            {practiceCase?.is_draft && (
              <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                Draft
              </Badge>
            )}
            {practiceCase?.published && (
              <Badge variant="default" className="text-green-600 border-green-300 bg-green-50">
                Published
              </Badge>
            )}
          </div>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default ProgressHeader;