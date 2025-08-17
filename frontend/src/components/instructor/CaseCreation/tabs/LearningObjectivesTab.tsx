// components/instructor/CaseCreation/tabs/LearningObjectivesTab.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Users, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface PracticeCase {
  proficiency_level?: string;
  curricular_goals?: string;
  key_items?: string;
  /** NEW: notes shown in the student conversation UI */
  notes_for_students?: string;
}

interface LearningObjectivesTabProps {
  practiceCase: PracticeCase | null;
  onFieldChange: (field: string, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const LearningObjectivesTab: React.FC<LearningObjectivesTabProps> = ({
  practiceCase,
  onFieldChange,
  onNext,
  onPrevious
}) => {
  return (
    <div className="space-y-6">
      {/* Student Profile */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-rose-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-rose-600" />
            <span>Student Profile</span>
          </CardTitle>
          <CardDescription>
            Describe your students' proficiency level (e.g., Novice, Intermediate, Advanced) and their current language abilities. You may reference frameworks like ACTFL or CEFR if helpful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="proficiency" className="text-base font-medium">
              Student Proficiency Level *
            </Label>
            <Textarea
              id="proficiency"
              value={practiceCase?.proficiency_level || ""}
              onChange={(e) => onFieldChange('proficiency_level', e.target.value)}
              placeholder="e.g., Intermediate level students who can form basic sentences but need practice with specific vocabulary..."
              className="min-h-[100px]"
            />
            <p className="text-sm text-gray-600">
              This helps the AI adjust its language complexity and speaking pace appropriately
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-rose-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-rose-600" />
            <span>Learning Objectives</span>
          </CardTitle>
          <CardDescription>
            Define what students should learn and practice in this session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="goals" className="text-base font-medium">
              Curricular Goals *
            </Label>
            <Textarea
              id="goals"
              value={practiceCase?.curricular_goals || ""}
              onChange={(e) => onFieldChange('curricular_goals', e.target.value)}
              placeholder="e.g., Practice food-related vocabulary, work on the simple past, practice polite phrases..."
              className="min-h-[120px]"
            />
            <p className="text-sm text-gray-600">
              List the specific learning objectives students should achieve
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-items" className="text-base font-medium">
              Key Vocabulary & Phrases
            </Label>
            <Textarea
              id="key-items"
              value={practiceCase?.key_items || ""}
              onChange={(e) => onFieldChange('key_items', e.target.value)}
              placeholder="e.g., Menu items, payment methods, customer service expressions, medical considerations..."
              className="min-h-[120px]"
            />
            <p className="text-sm text-gray-600">
              Important words, phrases, or expressions students should use or encounter
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Student Resource Panel */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-rose-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-rose-600" />
            <span>Student Resource Panel</span>
          </CardTitle>
          <CardDescription>
            Helpful information and tips that will be shown to students during the conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="notes-for-students" className="text-base font-medium">
              Student Help & Tips
            </Label>
            <Textarea
              id="notes-for-students"
              value={practiceCase?.notes_for_students || ""}
              onChange={(e) => onFieldChange('notes_for_students', e.target.value)}
              placeholder="Useful phrases to try, cultural etiquette tips, conversation goals, pronunciation reminders..."
              className="min-h-[120px]"
            />
            <p className="text-sm text-gray-600">
              Reference material and guidance shown in the student interface during practice
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          onClick={onPrevious}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back: Basic Info
        </Button>
        <Button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Scenario Setup
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default LearningObjectivesTab;