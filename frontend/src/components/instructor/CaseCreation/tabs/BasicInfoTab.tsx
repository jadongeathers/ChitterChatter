// components/instructor/CaseCreation/tabs/BasicInfoTab.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit, Clock, Globe, ChevronRight } from 'lucide-react';
import { CHARACTER_LIMITS, CharacterCounter } from '@/constants/characterLimits';

interface PracticeCase {
  id: number;
  title?: string;
  description?: string;
  min_time?: number;
  max_time?: number;
  accessible_on?: string;
  target_language?: string;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

interface BasicInfoTabProps {
  practiceCase: PracticeCase | null;
  onFieldChange: (field: string, value: any) => void;
  onNext: () => void;
  languageCodeMap: Record<string, string>;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  practiceCase,
  onFieldChange,
  onNext,
  languageCodeMap
}) => {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Helper function to format a date as YYYY-MM-DDTHH:mm in local time
  const formatLocalDateTime = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const pad = (n: number): string => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleFieldChange = (field: string, value: string, limit: number) => {
    if (value.length <= limit) {
      onFieldChange(field, value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title and Description */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-emerald-600" />
            <span>Case Information for Students</span>
          </CardTitle>
          <CardDescription>
            Basic details that students will see when browsing practice cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Practice Case Title *
            </Label>
            <Input
              id="title"
              value={practiceCase?.title || ""}
              onChange={(e) => handleFieldChange('title', e.target.value, CHARACTER_LIMITS.title)}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              maxLength={CHARACTER_LIMITS.title}
              placeholder="e.g., Ordering at a Restaurant"
              className="!text-base"
            />
            <CharacterCounter 
              current={(practiceCase?.title || "").length} 
              max={CHARACTER_LIMITS.title}
              isVisible={focusedField === 'title'}
            />
            <p className="text-sm text-gray-600">
              Choose a clear, descriptive title for your practice case
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Case Description *
            </Label>
            <Textarea
              id="description"
              value={practiceCase?.description || ""}
              onChange={(e) => handleFieldChange('description', e.target.value, CHARACTER_LIMITS.description)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              maxLength={CHARACTER_LIMITS.description}
              placeholder="Describe what students will practice and what to expect..."
              className="min-h-[120px] text-base"
            />
            <CharacterCounter 
              current={(practiceCase?.description || "").length} 
              max={CHARACTER_LIMITS.description}
              isVisible={focusedField === 'description'}
            />
            <p className="text-sm text-gray-600">
              Explain the scenario and what students can expect from this practice session
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            <span>Language Settings</span>
          </CardTitle>
          <CardDescription>
            Configure the target language for this practice session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-base font-medium">
              Target Language *
            </Label>
            <Select value={practiceCase?.target_language || ""} onValueChange={(value) => onFieldChange('target_language', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(languageCodeMap).map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">{lang}</span>
                      <span className="text-xs text-gray-500 ml-2">({languageCodeMap[lang]})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              The language students will practice during this session
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Time and Access Settings */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span>Time & Access Settings</span>
          </CardTitle>
          <CardDescription>
            Configure when students can access this case and session duration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-time" className="text-base font-medium">
                Minimum Duration (minutes) *
              </Label>
              <Input
                id="min-time"
                type="number"
                min="1"
                max="30"
                value={practiceCase && practiceCase.min_time ? Math.floor(practiceCase.min_time / 60) : 0}
                onChange={(e) => {
                  const minutes = Math.max(1, Math.min(30, Number(e.target.value) || 0));
                  onFieldChange('min_time', minutes * 60);
                }}
                placeholder="Enter minutes (0-30)"
                className="text-base"
              />
              <p className="text-sm text-gray-600">
                Minimum time students must practice before they can finish (1-30 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-time" className="text-base font-medium">
                Maximum Duration (minutes) *
              </Label>
              <Input
                id="max-time"
                type="number"
                min="1"
                max="30"
                value={practiceCase && practiceCase.max_time ? Math.floor(practiceCase.max_time / 60) : 0}
                onChange={(e) => {
                  const minutes = Math.max(1, Math.min(30, Number(e.target.value) || 0));
                  onFieldChange('max_time', minutes * 60);
                }}
                placeholder="Enter minutes (0-30)"
                className="text-base"
              />
              <p className="text-sm text-gray-600">
                Maximum time before the session automatically ends (1-30 minutes)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessible-on" className="text-base font-medium">
              Available From *
            </Label>
            <Input
              id="accessible-on"
              type="datetime-local"
              value={formatLocalDateTime(practiceCase?.accessible_on || "")}
              onChange={(e) => onFieldChange('accessible_on', e.target.value)}
              className="text-base"
            />
            <p className="text-sm text-gray-600">
              Students will be able to access this practice case starting from this date and time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Learning Objectives
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default BasicInfoTab;