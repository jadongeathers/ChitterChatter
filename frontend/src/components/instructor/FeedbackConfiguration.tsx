import React, { useState, useEffect } from "react";
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
  Zap
} from "lucide-react";

interface FeedbackSection {
  id: string;
  label: string;
  isChecked: boolean;
  text: string;
  category: 'communication' | 'language';
  description?: string;
}

interface FeedbackConfigurationProps {
  initialFeedbackPrompt?: string;
  onFeedbackChange: (feedbackPrompt: string) => void;
  className?: string;
}

const baseFeedbackPrompt = `You are an AI tutor--a Virtual Practice Partner (VPP)--that provides personalized feedback to students practicing their language skills. Use English to provide feedback. You should not make it clear that you are AI.

To provide feedback, you will use the transcript that follows from a student-VPP interaction. Your responses should be anchored in the transcript.

Your primary goal is to help students **improve proficiency, comfort, and confidence** in their target language.

Provide feedback in a **constructive, supportive, and encouraging tone**. 

If applicable, highlight both strengths and areas for improvement. Do not mention things that are not substantiated by the transcript.

Below are the specific areas of feedback that the instructor has selected for this session. Be careful to include feedback on each of these areas (if applicable):`;

const getPredefinedSections = (): FeedbackSection[] => [
  {
    id: "holistic",
    label: "Overall Communication",
    category: "communication",
    isChecked: false,
    description: "General fluency, clarity, and message delivery",
    text: "Provide feedback on the overall ability of the student to convey their message clearly and effectively, focusing on fluency and comprehension."
  },
  {
    id: "conversation",
    label: "Conversation Skills",
    category: "communication",
    isChecked: false,
    description: "Turn-taking, responses, and dialogue flow",
    text: "Evaluate how well the student maintained the conversation flow, responded appropriately, and engaged in natural dialogue."
  },
  {
    id: "grammar",
    label: "Grammar & Syntax",
    category: "language",
    isChecked: false,
    description: "Sentence structure, verb tenses, and grammatical accuracy",
    text: "Identify and correct any grammar or syntax errors. Suggest improvements for sentence structure where necessary."
  },
  {
    id: "vocabulary",
    label: "Vocabulary & Word Choice",
    category: "language",
    isChecked: false,
    description: "Appropriateness and variety of vocabulary usage",
    text: "Provide suggestions on better vocabulary usage to enhance clarity and precision."
  },
  {
    id: "pronunciation",
    label: "Pronunciation & Clarity",
    category: "language",
    isChecked: false,
    description: "Speech clarity and pronunciation feedback",
    text: "Comment on pronunciation clarity and suggest improvements for better articulation where applicable."
  }
];

const FeedbackConfiguration: React.FC<FeedbackConfigurationProps> = ({
  initialFeedbackPrompt,
  onFeedbackChange,
  className = ""
}) => {
  console.log('FeedbackConfiguration rendered with:', {
    initialFeedbackPrompt: initialFeedbackPrompt?.substring(0, 100) + '...',
    hasPrompt: !!initialFeedbackPrompt
  });
  const [feedbackSections, setFeedbackSections] = useState<FeedbackSection[]>([]);
  const [customFeedback, setCustomFeedback] = useState<string[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionText, setNewSectionText] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize feedback sections
  useEffect(() => {
    const sections = getPredefinedSections();
    setFeedbackSections(sections);
  }, []);

  // Parse feedback prompt separately after sections are initialized

  useEffect(() => {
    if (!isInitialized && initialFeedbackPrompt?.trim()) {
      parseFeedbackPrompt(initialFeedbackPrompt);
      setIsInitialized(true);
    }
  }, [initialFeedbackPrompt, isInitialized]);

  // Notify parent of changes whenever feedback data changes
  useEffect(() => {
    if (isInitialized) {
      const newPrompt = generateFeedbackPrompt();
      console.log('Notifying parent of feedback change:', newPrompt);
      onFeedbackChange(newPrompt);
    }
  }, [feedbackSections, customFeedback, isInitialized]);

  const parseFeedbackPrompt = (prompt: string) => {
    console.log('Starting to parse prompt:', prompt);
    
    const predefinedSections = getPredefinedSections();
    
    // Check which predefined sections are included in the prompt
    const updatedSections = predefinedSections.map((section) => {
      // Look for the exact section text in the prompt
      const isIncluded = prompt.includes(section.text);
      console.log(`Section "${section.label}":`, {
        isIncluded,
        sectionText: section.text.substring(0, 80) + '...'
      });
      return {
        ...section,
        isChecked: isIncluded,
      };
    });

    console.log('Updated sections with checkboxes:', updatedSections.map(s => ({ 
      label: s.label, 
      isChecked: s.isChecked 
    })));
    
    setFeedbackSections(updatedSections);

    // Extract custom feedback
    let remainingPrompt = prompt;
    
    // Remove base prompt if it exists
    if (remainingPrompt.includes(baseFeedbackPrompt)) {
      remainingPrompt = remainingPrompt.replace(baseFeedbackPrompt, "");
    }
    
    // Remove all predefined section texts that are in the prompt
    predefinedSections.forEach(section => {
      if (remainingPrompt.includes(section.text)) {
        remainingPrompt = remainingPrompt.replace(section.text, "");
      }
    });
    
    // Clean up and extract custom feedback
    // Split by various possible separators and clean up
    const extractedCustomFeedback = remainingPrompt
      .split(/\n{2,}|\n(?=[A-Z])/) // Split on double newlines or newlines followed by capital letters
      .map(text => text.trim())
      .filter(text => 
        text.length > 0 && 
        !text.includes("Below are the specific areas") &&
        !text.includes("Be careful to include feedback") &&
        text.length > 20 // Filter out very short fragments
      );

    console.log('Remaining prompt after cleanup:', remainingPrompt);
    console.log('Extracted custom feedback:', extractedCustomFeedback);
    setCustomFeedback(extractedCustomFeedback);
  };

  const generateFeedbackPrompt = () => {
    const selectedSections = feedbackSections
      .filter(section => section.isChecked)
      .map(section => section.text);

    const promptParts = [baseFeedbackPrompt];
    
    // Add selected sections
    if (selectedSections.length > 0) {
      promptParts.push(...selectedSections);
    }
    
    // Add custom feedback
    if (customFeedback.length > 0) {
      promptParts.push(...customFeedback);
    }

    return promptParts
      .filter(text => text && text.trim())
      .join("\n\n");
  };

  const handleSectionToggle = (sectionId: string) => {
    setFeedbackSections(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, isChecked: !section.isChecked }
          : section
      )
    );
  };

  const handleCustomFeedbackChange = (index: number, value: string) => {
    const updated = [...customFeedback];
    updated[index] = value;
    setCustomFeedback(updated);
  };

  const handleRemoveCustomFeedback = (index: number) => {
    setCustomFeedback(customFeedback.filter((_, i) => i !== index));
  };

  const handleAddCustomFeedback = () => {
    if (!newSectionTitle.trim() || !newSectionText.trim()) {
      return;
    }

    const newSection = `**${newSectionTitle}**: ${newSectionText}`;
    setCustomFeedback([...customFeedback, newSection]);
    setNewSectionTitle("");
    setNewSectionText("");
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Predefined Sections */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Feedback Areas</span>
          </CardTitle>
          <CardDescription>
            Choose which language skills the AI should focus on when giving feedback
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
                  .map((section) => (
                    <motion.div
                      key={section.id}
                      layout
                      className={`border rounded-lg p-3 transition-all cursor-pointer ${
                        section.isChecked 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleSectionToggle(section.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={section.isChecked}
                          onCheckedChange={() => handleSectionToggle(section.id)}
                          className="mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{section.label}</div>
                          {section.description && (
                            <div className="text-sm text-gray-500">{section.description}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Sections */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Custom Feedback Sections</span>
          </CardTitle>
          <CardDescription>
            Add specialized feedback areas unique to your teaching goals
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
                    <div className="flex-1">
                      <Textarea
                        value={feedback}
                        onChange={(e) => handleCustomFeedbackChange(index, e.target.value)}
                        className="min-h-[80px]"
                        placeholder="Enter custom feedback instructions..."
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
            <div className="space-y-3">
              <div>
                <Label htmlFor="section-title">Section Title</Label>
                <Input
                  id="section-title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g., Cultural Appropriateness"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="section-text">Feedback Instructions</Label>
                <Textarea
                  id="section-text"
                  value={newSectionText}
                  onChange={(e) => setNewSectionText(e.target.value)}
                  placeholder="Provide instructions for the AI on how to give feedback in this area..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <Button 
                onClick={handleAddCustomFeedback}
                disabled={!newSectionTitle.trim() || !newSectionText.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Section
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackConfiguration;