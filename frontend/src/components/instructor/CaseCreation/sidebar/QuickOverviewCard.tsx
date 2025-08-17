// components/instructor/CaseCreation/sidebar/QuickOverviewCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle2, Edit, XCircle } from 'lucide-react';

interface PracticeCase {
  id: number;
  target_language?: string;
  voice?: string;
  min_time?: number;
  max_time?: number;
  accessible_on?: string;
  published?: boolean;
  is_draft?: boolean;
}

interface SelectedClass {
  course_code: string;
}

interface QuickOverviewCardProps {
  practiceCase: PracticeCase | null;
  selectedClass: SelectedClass | null;
}

const QuickOverviewCard: React.FC<QuickOverviewCardProps> = ({
  practiceCase,
  selectedClass
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-green-600" />
          <span>Quick Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Class:</span>
          <span className="font-medium">{selectedClass?.course_code || 'Not set'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Language:</span>
          <span className="font-medium">{practiceCase?.target_language || 'Not set'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Voice:</span>
          <span className="font-medium capitalize">{practiceCase?.voice || 'verse'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duration:</span>
          <span className="font-medium">
            {practiceCase?.min_time && practiceCase?.max_time 
              ? `${Math.floor(practiceCase.min_time / 60)}-${Math.floor(practiceCase.max_time / 60)} min`
              : 'Not set'
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Available:</span>
          <span className="font-medium">
            {practiceCase?.accessible_on 
              ? new Date(practiceCase.accessible_on).toLocaleDateString()
              : 'Not set'
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <div className="flex items-center space-x-1">
            {practiceCase?.published ? (
              <Badge variant="default" className="text-green-700 bg-green-100 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Published
              </Badge>
            ) : practiceCase?.is_draft ? (
              <Badge variant="secondary" className="text-gray-700 bg-gray-100 border-gray-300">
                <Edit className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-700 bg-yellow-100 border-yellow-300">
                <XCircle className="h-3 w-3 mr-1" />
                Unpublished
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickOverviewCard;