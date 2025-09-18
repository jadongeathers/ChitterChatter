// components/instructor/CaseCreation/tabs/FeedbackTab.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Eye } from 'lucide-react';
import FeedbackConfiguration from '@/components/instructor/FeedbackConfiguration';

interface PracticeCase {
  id?: number;
  feedback_prompt?: string;
  cultural_context?: string;
}

interface FeedbackTabProps {
  practiceCase: PracticeCase | null;

  onFeedbackChange: (prompt: string) => void;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  canPublish: boolean;
}

const FeedbackTab: React.FC<FeedbackTabProps> = ({
  practiceCase,
  onFeedbackChange,
  onPrevious,
  onSaveDraft,
  onPublish,
  isSaving,
  canPublish
}) => {
  return (
    <>
      <FeedbackConfiguration
        key={practiceCase?.id}
        // CHANGE: only seed from saved value, never from a parent fallback
        initialFeedbackPrompt={practiceCase?.feedback_prompt ?? ""}
        culturalContext={practiceCase?.cultural_context}
        onFeedbackChange={onFeedbackChange}
      />

      {/* Tab Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          onClick={onPrevious}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back: Scenario Setup
        </Button>
        <div className="flex space-x-3">
          <Button 
            onClick={onSaveDraft}
            disabled={isSaving}
            variant="outline"
            className="bg-white border-gray-300 hover:bg-gray-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          {canPublish && (
            <Button 
              onClick={onPublish}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish Case
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default FeedbackTab;
