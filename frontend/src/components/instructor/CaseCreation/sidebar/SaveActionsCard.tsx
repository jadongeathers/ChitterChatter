// components/instructor/CaseCreation/sidebar/SaveActionsCard.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Eye, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SaveActionsCardProps {
  onSaveDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  canPublish: boolean;
  isNew: boolean;
  validationErrors: string[];
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  isPublished?: boolean;
}

const SaveActionsCard: React.FC<SaveActionsCardProps> = ({
  onSaveDraft,
  onPublish,
  onCancel,
  onDelete,
  isSaving,
  canPublish,
  isNew,
  validationErrors,
  hasUnsavedChanges,
  isAutoSaving,
  isPublished
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Save className="h-5 w-5 text-blue-600" />
          <span>Save & Publish</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Draft Button - Always available */}
        <Button 
          onClick={onSaveDraft}
          disabled={isSaving}
          variant="outline"
          className="w-full"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isNew ? 'Save as Draft' : 'Save Changes'}
            </>
          )}
        </Button>

        {/* Publish Button - Only available when validation passes */}
        <Button 
          onClick={onPublish}
          disabled={isSaving || !canPublish}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              {isNew ? 'Save & Publish' : 'Publish Case'}
            </>
          )}
        </Button>

        {/* Validation Status */}
        {!canPublish ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Required to publish</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  {validationErrors.slice(0, 3).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {validationErrors.length > 3 && (
                    <li>• And {validationErrors.length - 3} more...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : !isPublished && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Ready to publish!</p>
                <p className="text-xs text-green-700 mt-1">
                  All required fields are complete. Click "Publish Case" to make this available to students.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full"
          disabled={isSaving}
        >
          Cancel
        </Button>

        {!isNew && onDelete && (
          <Button 
            variant="destructive"
            onClick={onDelete}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Case
              </>
            )}
          </Button>
        )}

        {/* Status indicators */}
        <div className="space-y-2 pt-2 border-t">
          {isAutoSaving && (
            <div className="text-sm text-blue-600 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Auto-saving...</span>
            </div>
          )}
          {hasUnsavedChanges && !isAutoSaving && (
            <div className="text-sm text-amber-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
          {!hasUnsavedChanges && !isAutoSaving && !isNew && (
            <div className="text-sm text-green-600 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>All changes saved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SaveActionsCard;