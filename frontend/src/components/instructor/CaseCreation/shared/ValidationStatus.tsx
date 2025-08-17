// components/instructor/CaseCreation/shared/ValidationStatus.tsx

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ValidationStatusProps {
  canPublish: boolean;
  validationErrors: string[];
  isPublished?: boolean;
  isMobile?: boolean;
}

const ValidationStatus: React.FC<ValidationStatusProps> = ({
  canPublish,
  validationErrors,
  isPublished,
  isMobile = false
}) => {
  if (canPublish && !isPublished) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Ready to publish!</p>
            <p className="text-xs text-green-700 mt-1">
              {isMobile 
                ? "All required fields are complete."
                : "All required fields are complete. Click \"Publish Case\" to make this available to students."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canPublish) {
    const maxErrors = isMobile ? 2 : 3;
    
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Required to publish</p>
            <ul className="text-xs text-amber-700 mt-1 space-y-1">
              {validationErrors.slice(0, maxErrors).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {validationErrors.length > maxErrors && (
                <li>• And {validationErrors.length - maxErrors} more...</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ValidationStatus;