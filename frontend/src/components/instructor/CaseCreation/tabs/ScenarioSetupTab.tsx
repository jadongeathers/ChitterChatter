// components/instructor/CaseCreation/tabs/ScenarioSetupTab.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, ChevronLeft, ChevronRight, Bot, Volume2, Settings, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';
import ImageManager from '@/components/instructor/ImageManager';
import { CHARACTER_LIMITS, CharacterCounter } from '@/constants/characterLimits';

// --- Interfaces ---
interface PracticeCase {
  id: number;
  situation_instructions?: string;
  cultural_context?: string;
  behavioral_guidelines?: string;
  voice?: string;
  images?: PracticeCaseImage[];
  // Conversation control settings
  speaking_speed?: 'slow' | 'normal' | 'fast';           // stored on the case; NOT in the prompt
  formality_level?: 'casual' | 'neutral' | 'formal';     // still encoded into the prompt
  response_length?: 'brief' | 'moderate' | 'detailed';   // still encoded into the prompt
}

interface PracticeCaseImage {
  id: number;
  image_url: string;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

interface ScenarioSetupTabProps {
  practiceCase: PracticeCase | null;
  onFieldChange: (field: string, value: any) => void;
  onImageUpdate: (images: PracticeCaseImage[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  voiceOptions: VoiceOption[];
  playVoicePreview: (voiceId: string) => void;
}

/**
 * Parse ONLY formality + response length from guidelines.
 * We no longer parse speed from the prompt.
 */
const parseSettingsFromGuidelines = (guidelines: string | undefined): {
  formality_level: 'casual' | 'neutral' | 'formal';
  response_length: 'brief' | 'moderate' | 'detailed';
} => {
  const settings = {
    formality_level: 'neutral' as 'casual' | 'neutral' | 'formal',
    response_length: 'moderate' as 'brief' | 'moderate' | 'detailed'
  };

  if (!guidelines) return settings;

  // Formality
  if (guidelines.includes('IMPORTANT: Use casual, informal language')) {
    settings.formality_level = 'casual';
  } else if (guidelines.includes('IMPORTANT: Use formal, polite language')) {
    settings.formality_level = 'formal';
  }

  // Response length
  if (guidelines.includes('IMPORTANT: You MUST keep your responses VERY short and VERY concise')) {
    settings.response_length = 'brief';
  } else if (guidelines.includes('IMPORTANT: Provide comprehensive responses')) {
    settings.response_length = 'detailed';
  }

  return settings;
};

/**
 * Remove any previous IMPORTANT control statements so we can re-append fresh ones.
 * (Speed IMPORTANT lines are not used anymore, but this keeps your original behavior.)
 */
const getCleanBehavioralGuidelines = (guidelines: string | undefined): string => {
  if (!guidelines) return '';
  return guidelines.split('\n\nIMPORTANT:')[0];
};

/**
 * Append only formality + response length IMPORTANT lines.
 * Speed is handled by the realtime `speed` param, not the prompt.
 */
const generateEnhancedBehavioralGuidelines = (
  baseGuidelines: string,
  settings: { formality_level: 'casual' | 'neutral' | 'formal'; response_length: 'brief' | 'moderate' | 'detailed' }
): string => {
  let enhanced = baseGuidelines;
  const importantFlags: string[] = [];

  // Formality
  const formalityMap: Record<string, string> = {
    casual: 'IMPORTANT: Use casual, informal language and contractions. Be friendly and relaxed in your speech.',
    formal: 'IMPORTANT: Use formal, polite language. Avoid contractions and maintain professional courtesy.'
  };
  if (settings.formality_level !== 'neutral') {
    importantFlags.push(formalityMap[settings.formality_level]);
  }

  // Response length
  const lengthMap: Record<string, string> = {
    brief: 'IMPORTANT: You MUST keep your responses VERY short and VERY concise - you MUST respond as briefly as possible while being helpful.',
    detailed: 'IMPORTANT: Provide comprehensive responses with explanations to help with listening comprehension.'
  };
  if (settings.response_length !== 'moderate') {
    importantFlags.push(lengthMap[settings.response_length]);
  }

  if (importantFlags.length > 0) {
    enhanced = `${enhanced}\n\n${importantFlags.join('\n')}`;
  }

  return enhanced;
};

const ScenarioSetupTab: React.FC<ScenarioSetupTabProps> = ({
  practiceCase,
  onFieldChange,
  onImageUpdate,
  onNext,
  onPrevious,
  voiceOptions,
  playVoicePreview
}) => {
  const initiallyParsed = parseSettingsFromGuidelines(practiceCase?.behavioral_guidelines);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Keep your advanced collapsible
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Local state mirrors the case + parsed guidelines.
  // speaking_speed comes from case (NOT parsed from prompt).
  const [localSettings, setLocalSettings] = useState({
    speaking_speed: (practiceCase?.speaking_speed ?? 'normal') as 'slow' | 'normal' | 'fast',
    formality_level: initiallyParsed.formality_level,
    response_length: initiallyParsed.response_length
  });

  // When guidelines text changes upstream, re-parse only formality/length.
  useEffect(() => {
    const parsed = parseSettingsFromGuidelines(practiceCase?.behavioral_guidelines);
    setLocalSettings(prev => ({
      ...prev,
      formality_level: parsed.formality_level,
      response_length: parsed.response_length
    }));
  }, [practiceCase?.behavioral_guidelines]);

  // When the case's speaking_speed changes upstream, sync it.
  useEffect(() => {
    if (practiceCase?.speaking_speed) {
      setLocalSettings(prev => ({ ...prev, speaking_speed: practiceCase.speaking_speed! }));
    }
  }, [practiceCase?.speaking_speed]);

  // Helper function for character-limited field changes
  const handleFieldChange = (field: string, value: string, limit: number) => {
    if (value.length <= limit) {
      onFieldChange(field, value);
    }
  };

  // Handle control changes.
  const handleControlChange = (
    field: keyof typeof localSettings,
    value: 'slow' | 'normal' | 'fast' | 'casual' | 'neutral' | 'formal' | 'brief' | 'moderate' | 'detailed'
  ) => {
    const updated = { ...localSettings, [field]: value } as typeof localSettings;
    setLocalSettings(updated);

    if (field === 'speaking_speed') {
      // Persist on the case; not in the prompt
      onFieldChange('speaking_speed', value);
      return;
    }

    // For formality/length: rebuild guidelines text and also mirror the field on the case
    if (field === 'formality_level' || field === 'response_length') {
      const clean = getCleanBehavioralGuidelines(practiceCase?.behavioral_guidelines);
      const enhanced = generateEnhancedBehavioralGuidelines(clean, {
        formality_level: updated.formality_level,
        response_length: updated.response_length
      });
      onFieldChange('behavioral_guidelines', enhanced);
      onFieldChange(field, value);
    }
  };

  // Manual edits to base guidelines: re-append formality/length IMPORTANTs.
  const handleBehavioralGuidelinesChange = (value: string) => {
    if (value.length <= CHARACTER_LIMITS.behavioral_guidelines) {
      const enhanced = generateEnhancedBehavioralGuidelines(value, {
        formality_level: localSettings.formality_level,
        response_length: localSettings.response_length
      });
      onFieldChange('behavioral_guidelines', enhanced);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white border-l-4 border-violet-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span>Conversation Scenario</span>
          </CardTitle>
          <CardDescription>
            Set up the context and setting for the practice conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="situation" className="text-base font-medium">
              Scenario Context *
            </Label>
            <Textarea
              id="situation"
              value={practiceCase?.situation_instructions || ''}
              onChange={(e) => handleFieldChange('situation_instructions', e.target.value, CHARACTER_LIMITS.situation_instructions)}
              onFocus={() => setFocusedField('situation_instructions')}
              onBlur={() => setFocusedField(null)}
              maxLength={CHARACTER_LIMITS.situation_instructions}
              placeholder="e.g., You are at a traditional Spanish restaurant. The student is a customer who wants to order food..."
              className="min-h-[140px]"
            />
            <CharacterCounter 
              current={(practiceCase?.situation_instructions || "").length} 
              max={CHARACTER_LIMITS.situation_instructions}
              isVisible={focusedField === 'situation_instructions'}
            />
            <p className="text-sm text-gray-600">
              Describe the scenario context and setting for the conversation to the AI
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cultural-context" className="text-base font-medium">
              Cultural Context
            </Label>
            <Textarea
              id="cultural-context"
              value={practiceCase?.cultural_context || ''}
              onChange={(e) => handleFieldChange('cultural_context', e.target.value, CHARACTER_LIMITS.cultural_context)}
              onFocus={() => setFocusedField('cultural_context')}
              onBlur={() => setFocusedField(null)}
              maxLength={CHARACTER_LIMITS.cultural_context}
              placeholder="e.g., This is a formal dining establishment in Madrid where tipping is not expected..."
              className="min-h-[120px]"
            />
            <CharacterCounter 
              current={(practiceCase?.cultural_context || "").length} 
              max={CHARACTER_LIMITS.cultural_context}
              isVisible={focusedField === 'cultural_context'}
            />
            <p className="text-sm text-gray-600">
              Provide cultural background to the AI
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Personality & Voice */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-violet-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            <span>AI Personality & Voice</span>
          </CardTitle>
          <CardDescription>
            Define how the AI conversation partner should behave and sound
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="behavioral" className="text-base font-medium">
              Character Personality *
            </Label>
            <Textarea
              id="behavioral"
              value={getCleanBehavioralGuidelines(practiceCase?.behavioral_guidelines)}
              onChange={(e) => handleBehavioralGuidelinesChange(e.target.value)}
              onFocus={() => setFocusedField('behavioral_guidelines')}
              onBlur={() => setFocusedField(null)}
              maxLength={CHARACTER_LIMITS.behavioral_guidelines}
              placeholder="e.g., You are a friendly, patient server who speaks clearly..."
              className="min-h-[140px]"
            />
            <CharacterCounter 
              current={getCleanBehavioralGuidelines(practiceCase?.behavioral_guidelines).length} 
              max={CHARACTER_LIMITS.behavioral_guidelines}
              isVisible={focusedField === 'behavioral_guidelines'}
            />
            <p className="text-sm text-gray-600">
              Define how the AI should behave, including tone, style, and cultural appropriateness.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice" className="text-base font-medium">
              AI Voice
            </Label>
            <Select value={practiceCase?.voice || 'verse'} onValueChange={(value) => onFieldChange('voice', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI voice" />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((voiceOption) => (
                  <SelectItem key={voiceOption.id} value={voiceOption.id}>
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="text-sm font-medium truncate">{voiceOption.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{voiceOption.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {practiceCase?.voice && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-indigo-900">
                      Selected: {voiceOptions.find(v => v.id === practiceCase?.voice)?.name}
                    </h4>
                    <p className="text-xs text-indigo-700 truncate">
                      {voiceOptions.find(v => v.id === practiceCase?.voice)?.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playVoicePreview(practiceCase?.voice || 'verse')}
                    className="flex items-center space-x-2 border-indigo-300 text-indigo-700 hover:bg-indigo-100 ml-3"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Preview</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings Collapsible (kept intact) */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Advanced Conversation Controls</span>
                </div>
                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <Card className="border-indigo-200 bg-indigo-50/30">
                <CardContent className="pt-6 space-y-6">
                  {/* Speaking Speed (NOT encoded into the prompt) */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-indigo-900">Speaking Speed</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'slow', label: 'Slow & Clear', description: 'Ideal for beginners' },
                        { value: 'normal', label: 'Normal', description: 'Standard pace' },
                        { value: 'fast', label: 'Native Speed', description: 'Natural, fast-paced' }
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3">
                          <Checkbox
                            id={`speed-${option.value}`}
                            checked={localSettings.speaking_speed === option.value}
                            onCheckedChange={(checked) => {
                              if (checked) handleControlChange('speaking_speed', option.value as any);
                            }}
                          />
                          <Label htmlFor={`speed-${option.value}`} className="text-sm cursor-pointer flex-1">
                            {option.label} <span className="text-xs text-gray-600">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Applied as an audio <code>speed</code> parameter (not in the prompt).
                    </p>
                  </div>

                  {/* Formality Level (still in prompt) */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-indigo-900">Formality Level</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'casual', label: 'Casual', description: 'Informal, friendly' },
                        { value: 'neutral', label: 'Neutral', description: 'Balanced formality' },
                        { value: 'formal', label: 'Formal', description: 'Professional, polite' }
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3">
                          <Checkbox
                            id={`formality-${option.value}`}
                            checked={localSettings.formality_level === option.value}
                            onCheckedChange={(checked) => {
                              if (checked) handleControlChange('formality_level', option.value as any);
                            }}
                          />
                          <Label htmlFor={`formality-${option.value}`} className="text-sm cursor-pointer flex-1">
                            {option.label} <span className="text-xs text-gray-600">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Response Length (still in prompt) */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-indigo-900">Response Length</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'brief', label: 'Brief', description: 'As short as possible' },
                        { value: 'moderate', label: 'Moderate', description: '1-2 sentences' },
                        { value: 'detailed', label: 'Detailed', description: 'Longer for listening practice' }
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3">
                          <Checkbox
                            id={`length-${option.value}`}
                            checked={localSettings.response_length === option.value}
                            onCheckedChange={(checked) => {
                              if (checked) handleControlChange('response_length', option.value as any);
                            }}
                          />
                          <Label htmlFor={`length-${option.value}`} className="text-sm cursor-pointer flex-1">
                            {option.label} <span className="text-xs text-gray-600">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-indigo-100 rounded-lg border border-indigo-300">
                    <p className="text-xs text-indigo-800">
                      Formality and response length are added as high‑priority instructions in the prompt.
                      Speaking speed is handled by the voice engine via the <code>speed</code> parameter.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Scenario Images */}
      {practiceCase && practiceCase?.id > 0 ? (
        <ImageManager
          caseId={practiceCase.id}
          images={practiceCase.images || []}
          onImageUpdate={onImageUpdate}
        />
      ) : (
        <Card className="shadow-lg border-0 bg-white mt-6 border-l-4 border-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImagePlus className="h-5 w-5 text-violet-600" />
              <span>Scenario Image</span>
            </CardTitle>
            <CardDescription>
              Optionally generate a visual aid for your scenario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              💡 Please <span className="font-medium">save your case</span> first to enable image generation.
            </p>
          </CardContent>
        </Card>
      )}


      {/* Tab Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back: Content & Goals
        </Button>
        <Button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: AI Feedback
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ScenarioSetupTab;