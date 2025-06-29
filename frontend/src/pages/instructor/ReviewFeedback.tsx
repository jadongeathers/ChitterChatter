import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
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
  Save, 
  RotateCcw, 
  Copy, 
  Eye,
  Lightbulb,
  Target,
  Check,
  X,
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  BookOpen,
  Zap
} from "lucide-react";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";
import { useParams, useNavigate } from 'react-router-dom';

interface FeedbackSection {
  id: string;
  label: string;
  isChecked: boolean;
  text: string;
  category: 'communication' | 'language';
  description?: string;
}

const ReviewFeedback: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { selectedClass } = useClass();
  const navigate = useNavigate();
  
  // State management
  const [feedbackSections, setFeedbackSections] = useState<FeedbackSection[]>([]);
  const [customFeedback, setCustomFeedback] = useState<string[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionText, setNewSectionText] = useState("");
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const baseFeedbackPrompt = `You are an AI tutor--a Virtual Practice Partner (VPP)--that provides personalized feedback to students practicing their language skills. Use English to provide feedback. You should not make it clear that you are AI.

To provide feedback, you will use the transcript that follows from a student-VPP interaction. Your responses should be anchored in the transcript.

Your primary goal is to help students **improve proficiency, comfort, and confidence** in their target language.

Provide feedback in a **constructive, supportive, and encouraging tone**. 

If applicable, highlight both strengths and areas for improvement. Do not mention things that are not substantiated by the transcript.

Below are the specific areas of feedback that the instructor has selected for this session. Be careful to include feedback on each of these areas (if applicable):`;

  // Predefined feedback sections
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

  // Initialize feedback sections
  useEffect(() => {
    setFeedbackSections(getPredefinedSections());
    fetchCaseDetails();
  }, [caseId]);

  // Clear status message after delay
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchCaseDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`/api/practice_cases/get_case/${caseId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setStatusMessage({
            type: 'error',
            message: `Practice case with ID ${caseId} not found. Please check the URL.`
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setCaseDetails(data);
      if (data.feedback_prompt) {
        parseFeedbackPrompt(data.feedback_prompt);
      }
    } catch (error) {
      console.error("Error fetching case details:", error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to load case details. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseFeedbackPrompt = (prompt: string) => {
    // Get fresh predefined sections
    const predefinedSections = getPredefinedSections();
    
    // Check which predefined sections are included in the prompt
    const updatedSections = predefinedSections.map((section) => ({
      ...section,
      isChecked: prompt.includes(section.text),
    }));

    setFeedbackSections(updatedSections);

    // Extract custom feedback by removing base prompt and predefined sections
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
    
    // Split remaining content and filter out empty strings
    const extractedCustomFeedback = remainingPrompt
      .split("\n\n")
      .map(text => text.trim())
      .filter(text => text.length > 0);

    setCustomFeedback(extractedCustomFeedback);
  };

  const handleSectionToggle = (sectionId: string) => {
    setFeedbackSections(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, isChecked: !section.isChecked }
          : section
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleCustomFeedbackChange = (index: number, value: string) => {
    const updated = [...customFeedback];
    updated[index] = value;
    setCustomFeedback(updated);
    setHasUnsavedChanges(true);
  };

  const handleRemoveCustomFeedback = (index: number) => {
    setCustomFeedback(customFeedback.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleAddCustomFeedback = () => {
    if (!newSectionTitle.trim() || !newSectionText.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Please provide both title and text for the custom feedback section.'
      });
      return;
    }

    const newSection = `**${newSectionTitle}**: ${newSectionText}`;
    setCustomFeedback([...customFeedback, newSection]);
    setNewSectionTitle("");
    setNewSectionText("");
    setHasUnsavedChanges(true);
  };

  const resetToDefaults = () => {
    setFeedbackSections(getPredefinedSections());
    setCustomFeedback([]);
    setHasUnsavedChanges(true);
    setStatusMessage({
      type: 'success',
      message: 'Reset to default feedback sections.'
    });
  };

  const generatePromptPreview = () => {
    const selectedSections = feedbackSections
      .filter(section => section.isChecked)
      .map(section => section.text);

    return [baseFeedbackPrompt, ...selectedSections, ...customFeedback]
      .filter(text => text.trim())
      .join("\n\n");
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const fullPrompt = generatePromptPreview();

      const response = await fetchWithAuth(`/api/practice_cases/update_case/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback_prompt: fullPrompt })
      });

      if (!response.ok) throw new Error('Failed to save');

      setStatusMessage({
        type: 'success',
        message: 'Feedback prompt saved successfully!'
      });
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error("Error saving feedback prompt:", error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to save feedback prompt. Please try again.'
      });
    } finally {
      setIsSaving(false);
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

  if (isLoading) {
    return (
      <ClassAwareLayout title="Loading..." description="Loading feedback configuration...">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading feedback settings...</span>
        </div>
      </ClassAwareLayout>
    );
  }

  return (
    <ClassAwareLayout
      title="Customize Feedback Prompt"
      description={`Configure AI feedback settings for "${caseDetails?.title || 'Practice Case'}"`}
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/instructor/lessons')}
          className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lessons</span>
        </Button>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border mb-6 ${
              statusMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {statusMessage.type === 'success' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p className="font-medium">{statusMessage.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <Card className="p-6 bg-white shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback Configuration</h3>
            <p className="text-gray-600 text-sm">Select which areas the AI should focus on when providing feedback</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
          <Card className="shadow-lg border-0 bg-white sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Save className="h-5 w-5 text-blue-600" />
                <span>Save Changes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Feedback Settings
                  </>
                )}
              </Button>
              
              {hasUnsavedChanges && (
                <div className="text-sm text-amber-600 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>You have unsaved changes</span>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => navigate('/instructor/lessons')}
                className="w-full"
              >
                Cancel & Return
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span>Prompt Preview</span>
                    </CardTitle>
                    <CardDescription>
                      How the complete prompt will appear to the AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto text-sm font-mono text-gray-700 whitespace-pre-wrap">
                      {generatePromptPreview()}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => navigator.clipboard.writeText(generatePromptPreview())}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-amber-800">
                <Lightbulb className="h-5 w-5" />
                <span>Feedback Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-700">
              <div className="space-y-2">
                <div>• Select 3-5 feedback areas for optimal results</div>
                <div>• Be specific in your instructions to the AI</div>
                <div>• Use encouraging language in feedback prompts</div>
                <div>• Test with different combinations to find what works</div>
                <div>• Custom sections allow for specialized feedback</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClassAwareLayout>
  );
};

export default ReviewFeedback;