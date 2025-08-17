// components/instructor/CaseCreation/sidebar/TipsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const TipsCard: React.FC = () => {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Lightbulb className="h-5 w-5" />
          <span>Tips</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-blue-700">
        <div className="space-y-2">
          <div>• Your progress is automatically saved as you work</div>
          <div>• Save drafts anytime to preserve your work</div>
          <div>• Complete all required fields to publish</div>
          <div>• Keep scenario instructions clear and specific</div>
          <div>• Match time limits to student proficiency level</div>
          <div>• Include cultural context in behavioral guidelines</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TipsCard;