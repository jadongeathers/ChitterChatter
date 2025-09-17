import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Plus, 
  Target,
  MessageSquare,
  BookOpen,
  Zap,
  AlertCircle
} from "lucide-react";
import { CHARACTER_LIMITS, CharacterCounter } from '@/constants/characterLimits';

interface FeedbackSection {
  id: string;
  label: string;
  isChecked: boolean;
  text: string;
  category: 'communication' | 'language';
  description?: string;
  requiresCulturalContext?: boolean;
}

interface FeedbackConfigurationProps {
  initialFeedbackPrompt?: string;
  culturalContext?: string;
  onFeedbackChange: (feedbackPrompt: string) => void;
  className?: string;
}

const baseFeedbackPrompt = `You are an AI tutor--a Virtual Practice Partner (VPP)--that provides personalized feedback to students practicing their language skills. You must use English to provide feedback. You should not make it clear that you are AI.

To provide feedback, you will use the transcript that follows from a student-VPP interaction. Your responses should be anchored in the transcript, and you should cite the transcript when necessary to support your feedback.

Your primary goal is to help students **improve proficiency, comfort, and confidence** in their target language.

Provide feedback in a **constructive, supportive, and encouraging tone**. 

If applicable, highlight both strengths and areas for improvement by using the sandwich feedback method. Do not mention things that are not substantiated by the transcript.

Below are the specific areas of feedback that the instructor has selected for this session. For each selected area that is applicable to the conversation, provide:
- **Strengths**: 2-3 specific examples of what the student did well in this area
- **Areas for Improvement**: 2-3 specific areas where the student can improve
- **Tips**: 2-3 actionable suggestions for improvement

Areas to evaluate:`;

const getPredefinedSections = (): FeedbackSection[] => [
  {
    id: "holistic",
    label: "Overall Communication",
    category: "communication",
    isChecked: false,
    description: "General fluency, clarity, and message delivery",
    text: "**Overall Communication**: Evaluate the student's general ability to convey their message clearly and effectively. Focus on fluency, comprehension, and overall communicative competence. Assess how well they maintained the flow of conversation and achieved their communicative goals."
  },
  {
    id: "conversation",
    label: "Conversation Skills",
    category: "communication",
    isChecked: false,
    description: "Turn-taking, responses, and dialogue flow",
    text: "**Conversation Skills**: Analyze how well the student maintained conversation flow, responded appropriately to questions and comments, initiated topics, and engaged in natural dialogue. Look at their ability to ask follow-up questions, show interest, and navigate conversational turns effectively."
  },
  {
    id: "cultural",
    label: "Cultural Appropriateness",
    category: "communication",
    isChecked: false,
    description: "Cultural sensitivity, context awareness, and appropriate behavior according to the Cultural Context",
    text: "**Cultural Appropriateness**: Assess the student's cultural awareness and appropriateness of their responses within the given cultural context. Evaluate cultural sensitivity, understanding of social norms, contextually appropriate behavior, and proper use of formal/informal language registers.",
    requiresCulturalContext: true
  },
  {
    id: "grammar",
    label: "Grammar & Syntax",
    category: "language",
    isChecked: false,
    description: "Sentence structure, verb tenses, and grammatical accuracy",
    text: "**Grammar & Syntax**: Examine grammatical accuracy, proper verb tense usage, sentence structure, word order, and syntactic complexity. Identify patterns of errors and areas where the student demonstrates strong grammatical control."
  },
  {
    id: "vocabulary",
    label: "Vocabulary & Word Choice",
    category: "language",
    isChecked: false,
    description: "Appropriateness and variety of vocabulary usage",
    text: "**Vocabulary & Word Choice**: Evaluate the appropriateness, variety, and precision of vocabulary usage. Assess the student's range of vocabulary, appropriate word choice for context, and ability to express complex ideas with appropriate terminology."
  }
];

const FeedbackConfiguration: React.FC<FeedbackConfigurationProps> = ({
  initialFeedbackPrompt,
  culturalContext,
  onFeedbackChange,
  className = ""
}) => {
  const [feedbackSections, setFeedbackSections] = useState<FeedbackSection[]>(getPredefinedSections());
  const [customFeedback, setCustomFeedback] = useState<string[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionText, setNewSectionText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Prevent any emits during initial hydration
  const hasHydratedRef = useRef(false);

  /** ---------- Parse from initial prompt (no emits on mount) ---------- */
  useEffect(() => {
    if (initialFeedbackPrompt?.trim()) {
      parseFeedbackPrompt(initialFeedbackPrompt);
    } else {
      setFeedbackSections(getPredefinedSections());
      setCustomFeedback([]);
    }
    hasHydratedRef.current = true; // subsequent user actions may emit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFeedbackPrompt]);

  useEffect(() => {
    validateCulturalContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackSections, culturalContext]);

  /** ---------- Helpers ---------- */

  const validateCulturalContext = () => {
    const culturalSectionChecked = feedbackSections.find(s => s.id === 'cultural')?.isChecked;
    if (culturalSectionChecked && (!culturalContext || !culturalContext.trim())) {
      setValidationError("Cultural context is required when Cultural Appropriateness feedback is selected. Please add cultural context in the Scenario Setup tab.");
    } else {
      setValidationError(null);
    }
  };

  const parseFeedbackPrompt = (prompt: string) => {
    const predefined = getPredefinedSections();

    // Determine which predefined sections are present
    const updatedSections = predefined.map((section) => ({
      ...section,
      isChecked: prompt.includes(section.text),
    }));
    setFeedbackSections(updatedSections);

    // Remove base prompt, predefined sections, and known system lines to get custom blocks
    let remainingPrompt = prompt;
    if (remainingPrompt.includes(baseFeedbackPrompt)) {
      remainingPrompt = remainingPrompt.replace(baseFeedbackPrompt, "");
    }
    predefined.forEach(section => {
      if (remainingPrompt.includes(section.text)) {
        remainingPrompt = remainingPrompt.replace(section.text, "");
      }
    });
    const jsonInstructionsPattern = /\*\*IMPORTANT FORMATTING REQUIREMENTS:\*\*[\s\S]*?- Focus only on areas that are actually relevant based on the conversation content/;
    remainingPrompt = remainingPrompt.replace(jsonInstructionsPattern, "");

    const extractedCustom = remainingPrompt
      .split(/\n{2,}/)
      .map(t => t.trim())
      .filter(t => t && ![
        "Below are the specific areas",
        "Areas to evaluate:",
        "CULTURAL CONTEXT:",
        "IMPORTANT FORMATTING REQUIREMENTS:",
        "Organize your feedback into a clear summary",
        "For each selected feedback area",
        "Include specific examples from the transcript",
        "Conclude with an encouraging message",
        "Focus only on areas that are actually relevant"
      ].some(phrase => t.includes(phrase)));

    setCustomFeedback(extractedCustom);
  };

  const generateFeedbackPromptFrom = (
    sections: FeedbackSection[],
    custom: string[],
    ctx?: string
  ) => {
    const selected = sections
      .filter(s => s.isChecked)
      .map(s => {
        let sectionText = s.text;
        if (s.requiresCulturalContext && ctx?.trim()) {
          sectionText += `\n\nCULTURAL CONTEXT: ${ctx.trim()}`;
        }
        return sectionText;
      });

    const promptParts = [baseFeedbackPrompt];
    if (selected.length > 0) promptParts.push(...selected);

    const systemPhrases = [
      "IMPORTANT FORMATTING REQUIREMENTS:",
      "Organize your feedback into a clear summary",
      "For each selected feedback area",
      "Include specific examples from the transcript",
      "Conclude with an encouraging message",
      "Focus only on areas that are actually relevant"
    ];
    const filteredCustom = custom.filter(f => !systemPhrases.some(p => f.includes(p)));

    if (filteredCustom.length > 0) promptParts.push(...filteredCustom);

    return promptParts.filter(Boolean).join("\n\n");
  };

  /** ---------- User interaction (emit on real changes only) ---------- */

  const emitIfHydrated = (sections: FeedbackSection[], custom: string[]) => {
    if (!hasHydratedRef.current) return;
    const prompt = generateFeedbackPromptFrom(sections, custom, culturalContext);
    onFeedbackChange(prompt);
  };

  const handleSectionToggle = (sectionId: string) => {
    setFeedbackSections(prev => {
      const next = prev.map(s => s.id === sectionId ? { ...s, isChecked: !s.isChecked } : s);
      emitIfHydrated(next, customFeedback); // EMIT on checkbox change
      return next;
    });
  };

  const handleCustomFeedbackChange = (index: number, value: string) => {
    if (value.length > CHARACTER_LIMITS.feedback_prompt) return;
    const next = [...customFeedback];
    next[index] = value;
    setCustomFeedback(next);
    emitIfHydrated(feedbackSections, next); // EMIT on text change (remove if you only want checkboxes to count)
  };

  const handleRemoveCustomFeedback = (index: number) => {
    const next = customFeedback.filter((_, i) => i !== index);
    setCustomFeedback(next);
    emitIfHydrated(feedbackSections, next);
  };

  const handleAddCustomFeedback = () => {
    if (!newSectionTitle.trim() || !newSectionText.trim()) return;
    const newSection = `**${newSectionTitle}**: ${newSectionText}`;
    if (newSection.length > CHARACTER_LIMITS.feedback_prompt) return;

    const next = [...customFeedback, newSection];
    setCustomFeedback(next);
    setNewSectionTitle("");
    setNewSectionText("");
    emitIfHydrated(feedbackSections, next);
  };

  const handleNewSectionTitleChange = (value: string) => {
    if (value.length <= CHARACTER_LIMITS.title) {
      setNewSectionTitle(value);
    }
  };

  const handleNewSectionTextChange = (value: string) => {
    if (value.length <= CHARACTER_LIMITS.feedback_prompt) {
      setNewSectionText(value);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'language': return <BookOpen className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'communication': return 'Communication Skills';
      case 'language': return 'Language Skills';
      default: return 'Custom Skills';
    }
  };

  /** ---------- UI ---------- */
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Validation Error */}
      {validationError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{validationError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predefined Sections */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 ">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Feedback Areas</span>
          </CardTitle>
          <CardDescription>
            Choose which language skills the AI should focus on when giving feedback. Each area will include detailed strengths, improvement areas, and actionable tips.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {['communication', 'language'].map(category => (
            <div key={category} className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center space-x-2">
                {getCategoryIcon(category)}
                <span>{getCategoryLabel(category)}</span>
              </h4>
              
              <div className="grid gap-2">
                {feedbackSections
                  .filter(section => section.category === category)
                  .map((section) => {
                    const isDisabled = section.requiresCulturalContext && (!culturalContext || !culturalContext.trim());
                    
                    return (
                      <motion.div
                        key={section.id}
                        layout
                        className={`border rounded-lg p-3 transition-all ${
                          isDisabled 
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                            : section.isChecked 
                              ? 'border-blue-300 bg-blue-50 cursor-pointer' 
                              : 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && handleSectionToggle(section.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={section.isChecked}
                            disabled={isDisabled}
                            onCheckedChange={() => !isDisabled && handleSectionToggle(section.id)}
                            className="mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 flex items-center space-x-2">
                              <span>{section.label}</span>
                              {section.requiresCulturalContext && (
                                <Badge variant="outline" className="text-xs">
                                  Requires Cultural Context
                                </Badge>
                              )}
                            </div>
                            {section.description && (
                              <div className="text-sm text-gray-500">{section.description}</div>
                            )}
                            {isDisabled && (
                              <div className="text-xs text-red-600 mt-1">
                                Add cultural context in Scenario Setup to enable this option
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Sections */}
      <Card className="shadow-lg border-0 bg-white border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Custom Feedback Sections</span>
          </CardTitle>
          <CardDescription>
            Add specialized feedback areas unique to your teaching goals. Each custom section will follow the same structure: strengths, areas for improvement, and actionable tips.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Custom Sections */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            <AnimatePresence>
              {customFeedback.map((feedback, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-lg p-4 bg-amber-50"
                >
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">Custom</Badge>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={feedback}
                        onChange={(e) => handleCustomFeedbackChange(index, e.target.value)}
                        onFocus={() => setFocusedField(`custom-${index}`)}
                        onBlur={() => setFocusedField(null)}
                        maxLength={CHARACTER_LIMITS.feedback_prompt}
                        className="min-h-[80px]"
                        placeholder="Enter custom feedback instructions..."
                      />
                      <CharacterCounter 
                        current={feedback.length} 
                        max={CHARACTER_LIMITS.feedback_prompt}
                        isVisible={focusedField === `custom-${index}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomFeedback(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add New Custom Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-700">Add New Feedback Section</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-title">Section Title</Label>
                <Input
                  id="section-title"
                  value={newSectionTitle}
                  onChange={(e) => handleNewSectionTitleChange(e.target.value)}
                  onFocus={() => setFocusedField('new-section-title')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={CHARACTER_LIMITS.title}
                  placeholder="e.g., Pronunciation & Accent"
                  className="mt-1"
                />
                <CharacterCounter 
                  current={newSectionTitle.length} 
                  max={CHARACTER_LIMITS.title}
                  isVisible={focusedField === 'new-section-title'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section-text">Feedback Instructions</Label>
                <Textarea
                  id="section-text"
                  value={newSectionText}
                  onChange={(e) => handleNewSectionTextChange(e.target.value)}
                  onFocus={() => setFocusedField('new-section-text')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={CHARACTER_LIMITS.feedback_prompt}
                  placeholder="Provide instructions for the AI on how to evaluate this area. Include what specific aspects to look for and how to provide constructive feedback..."
                  className="mt-1 min-h-[80px]"
                />
                <CharacterCounter 
                  current={newSectionText.length} 
                  max={CHARACTER_LIMITS.feedback_prompt}
                  isVisible={focusedField === 'new-section-text'}
                />
              </div>
              <Button 
                onClick={handleAddCustomFeedback}
                disabled={!newSectionTitle.trim() || !newSectionText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Section
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON Structure Preview */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-700">
            <Zap className="h-5 w-5" />
            <span>Structured Feedback Format</span>
          </CardTitle>
          <CardDescription>
            Your feedback will be generated in a structured format for better presentation and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-2">Feedback Structure:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <span className="font-semibold">Summary:</span> Overall strengths and areas for improvement</li>
              <li>• <span className="font-semibold">Detailed Analysis:</span> Section-by-section breakdown for each selected area</li>
              <li>• <span className="font-semibold">Specific Examples:</span> References to actual conversation moments</li>
              <li>• <span className="font-semibold">Actionable Tips:</span> Concrete suggestions for improvement</li>
              <li>• <span className="font-semibold">Encouragement:</span> Motivational closing message</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackConfiguration;
