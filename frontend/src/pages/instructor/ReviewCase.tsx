import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  X, 
  Trash2,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  BookOpen,
  Clock,
  Calendar,
  Globe,
  Volume2,
  Users,
  Target,
  MessageSquare,
  FileText,
  Settings,
  Lightbulb,
  Eye,
  Edit,
  CheckCircle2,
  XCircle
} from "lucide-react";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import FeedbackConfiguration from "@/components/instructor/FeedbackConfiguration";
import { useClass } from "@/contexts/ClassContext";

interface PracticeCase {
  id: number;
  class_id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on: string;
  voice: string;
  language_code: string;
  published: boolean;
  is_draft: boolean;
  target_language: string;
  situation_instructions: string;
  curricular_goals: string;
  key_items: string;
  behavioral_guidelines: string;
  proficiency_level: string;
  instructor_notes: string;
  created_at?: string;
  feedback_prompt?: string;
}

// Language mapping for OpenAI transcription
const languageCodeMap: Record<string, string> = {
  "English": "en",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Italian": "it",
  "Portuguese": "pt",
  "Dutch": "nl",
  "Russian": "ru",
  "Japanese": "ja",
  "Chinese": "zh",
  "Korean": "ko",
  "Arabic": "ar",
  "Hindi": "hi"
};

// OpenAI voice options with descriptions
const voiceOptions = [
  { id: "alloy", name: "Alloy", description: "Neutral, balanced tone" },
  { id: "ash", name: "Ash", description: "Warm, friendly voice" },
  { id: "ballad", name: "Ballad", description: "Calm, soothing tone" },
  { id: "coral", name: "Coral", description: "Bright, energetic voice" },
  { id: "echo", name: "Echo", description: "Clear, professional tone" },
  { id: "sage", name: "Sage", description: "Wise, measured voice" },
  { id: "shimmer", name: "Shimmer", description: "Light, pleasant tone" },
  { id: "verse", name: "Verse", description: "Expressive, dynamic voice" }
];

const ReviewCase: React.FC<{ isNew?: boolean }> = ({ isNew = false }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const { selectedClass, apiParams } = useClass();
  const navigate = useNavigate();
  
  // State management
  const [practiceCase, setPracticeCase] = useState<PracticeCase | null>(null);
  const [feedbackPrompt, setFeedbackPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [activeTab, setActiveTab] = useState("basics");

  // Get class_id from URL params or selected class
  const getClassId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlClassId = urlParams.get('class_id');
    if (urlClassId) return parseInt(urlClassId);
    return selectedClass?.class_id || null;
  };

  // Initialize feedback prompt when practice case loads
  useEffect(() => {
    if (practiceCase?.feedback_prompt) {
      setFeedbackPrompt(practiceCase.feedback_prompt);
    }
  }, [practiceCase?.feedback_prompt]);

  const handleFeedbackChange = (newFeedbackPrompt: string) => {
    setFeedbackPrompt(newFeedbackPrompt);
    setHasUnsavedChanges(true);
  };

  // Check for success message from URL params (for new case creation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successType = urlParams.get('success');
    
    if (successType === 'draft_saved') {
      setStatusMessage({ type: 'success', message: "Draft saved successfully!" });
      
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (successType === 'published') {
      setStatusMessage({ type: 'success', message: "Practice case published successfully!" });
      
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    if (isNew) {
      const classId = getClassId();
      if (!classId) {
        setStatusMessage({
          type: 'error',
          message: "No class selected. Please go back and select a class."
        });
        navigate("/instructor/lessons");
        return;
      }

      // Initialize empty fields for new practice case
      setPracticeCase({
        id: 0,
        class_id: classId,
        title: "",
        description: "",
        min_time: 0,
        max_time: 0,
        accessible_on: "",
        voice: "verse",
        language_code: "en",
        published: false,
        is_draft: true,
        target_language: "",
        situation_instructions: "",
        curricular_goals: "",
        key_items: "",
        behavioral_guidelines: "",
        proficiency_level: "",
        instructor_notes: "",
        created_at: new Date().toISOString()
      });
      setIsLoading(false);
      return;
    }

    // Fetch existing case
    const fetchPracticeCase = async () => {
      try {
        const response = await fetchWithAuth(`/api/practice_cases/get_case/${caseId}`);
        if (!response.ok) throw new Error("Failed to fetch practice case");
        
        const data = await response.json();
        setPracticeCase(data);
      } catch (err: unknown) {
        console.error("Error loading practice case:", err);
        setStatusMessage({
          type: 'error',
          message: "Failed to load practice case. Please try again."
        });
        navigate("/instructor/lessons");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPracticeCase();
  }, [caseId, isNew, selectedClass, navigate]);

  // Auto-save functionality
  const autoSaveDraft = useCallback(async () => {
    if (!practiceCase || !hasUnsavedChanges || isNew || !practiceCase.id) return;
    
    setIsAutoSaving(true);
    try {
      const response = await fetchWithAuth(`/api/practice_cases/update_case/${practiceCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...practiceCase,
          feedback_prompt: feedbackPrompt,
          is_draft: true
        }),
      });

      if (response.ok) {
        const { case: updatedCase } = await response.json();
        setPracticeCase(updatedCase); 
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [practiceCase, hasUnsavedChanges, isNew, feedbackPrompt]);

  // Auto-save timer
  useEffect(() => {
    if (hasUnsavedChanges && !isNew && practiceCase?.id) {
      const autoSaveTimer = setTimeout(() => {
        autoSaveDraft();
      }, 3000); // Auto-save after 3 seconds of inactivity
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, autoSaveDraft, isNew, practiceCase?.id]);

  // Clear status message after delay
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleFieldChange = (field: string, value: any) => {
    setHasUnsavedChanges(true);
    
    setPracticeCase(prev => prev ? { ...prev, [field]: value } : null);
    
    // Update language_code when target_language changes
    if (field === 'target_language' && languageCodeMap[value]) {
      setPracticeCase(prev => prev ? { ...prev, language_code: languageCodeMap[value] } : null);
    }
  };

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

  // Validate form for publishing
  const validateForPublishing = () => {
    const errors = [];
    
    if (!practiceCase?.title?.trim()) errors.push("Title is required");
    if (!practiceCase?.description?.trim()) errors.push("Description is required");
    if (!practiceCase?.target_language?.trim()) errors.push("Target language is required");
    if (!practiceCase?.situation_instructions?.trim()) errors.push("Situation instructions are required");
    if (!practiceCase?.curricular_goals?.trim()) errors.push("Curricular goals are required");
    if (!practiceCase?.behavioral_guidelines?.trim()) errors.push("Behavioral guidelines are required");
    if (!practiceCase?.proficiency_level?.trim()) errors.push("Proficiency level is required");
    if (!practiceCase?.min_time || practiceCase.min_time < 1) errors.push("Minimum time must be at least 1 minute");
    if (!practiceCase?.max_time || practiceCase.max_time < practiceCase.min_time) errors.push("Maximum time must be greater than minimum time");
    if (!practiceCase?.accessible_on) errors.push("Access date and time are required");
    
    return errors;
  };

  const canPublish = () => {
    return validateForPublishing().length === 0;
  };

  const playVoicePreview = async (voiceId: string) => {
    try {
      // Sample text to demonstrate the voice
      const sampleText = "Hello! I'm here to help you practice your conversation skills. Let's have a great learning session together.";
      
      // Use OpenAI's text-to-speech API
      const response = await fetchWithAuth('/api/chatbot/voice/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: voiceId,
          text: sampleText,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate voice preview');
      }
  
      // Get the audio blob and play it
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.play();
      
      // Clean up the URL after playing
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
    } catch (error) {
      console.error('Error playing voice preview:', error);
      // You could show a toast notification here
    }
  };

  const handleSaveDraft = async () => {
    if (!practiceCase) return;

    setIsSaving(true);

    try {
      const endpoint = isNew
        ? "/api/practice_cases/add_case"
        : `/api/practice_cases/update_case/${caseId}`;

      const method = isNew ? "POST" : "PUT";

      const payload: any = {
        ...practiceCase,
        feedback_prompt: feedbackPrompt,
        is_draft: true,
        published: false
      };

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save draft");
      }

      if (isNew) {
        // Show "Creating new case..." message first
        setStatusMessage({ type: 'success', message: "Creating new case..." });
        
        // **FIX:** When creating, the API returns the case object directly.
        const newCase = await response.json();
        setHasUnsavedChanges(false);
        
        // Wait 1.5 seconds to show the creating message, then navigate
        setTimeout(() => {
          // Navigate to the new page with a success message in the URL
          navigate(`/instructor/review/${newCase.id}?success=draft_saved`, { replace: true });
        }, 1500);
      } else {
        // For existing cases, show success immediately
        setStatusMessage({ type: 'success', message: "Draft saved successfully!" });
        setHasUnsavedChanges(false);
        
        // **FIX:** When updating, the API nests the object under a 'case' key.
        const { case: updatedCase } = await response.json();
        setPracticeCase(updatedCase);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setStatusMessage({
        type: 'error',
        message: `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!practiceCase) return;

    const validationErrors = validateForPublishing();
    if (validationErrors.length > 0) {
      setStatusMessage({
        type: 'error',
        message: `Cannot publish: ${validationErrors.join(', ')}`
      });
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = isNew
        ? "/api/practice_cases/add_case"
        : `/api/practice_cases/publish_case/${caseId}`;
        
      const method = isNew ? "POST" : "PUT";

      const payload: any = {
        ...practiceCase,
        feedback_prompt: feedbackPrompt, 
        is_draft: false,
        published: true
      };

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish practice case");
      }
      
      if (isNew) {
        // This is the flow for a brand new case
        setStatusMessage({ type: 'success', message: "Publishing new case..." });

        const newCase = await response.json();
        setHasUnsavedChanges(false);

        setTimeout(() => {
          // Navigate to the new URL and pass the trigger for the final message
          navigate(`/instructor/review/${newCase.id}?success=published`, { replace: true });
        }, 1500);

      } else {
        // This is for updating an existing case
        setStatusMessage({ type: 'success', message: "Practice case published successfully!" });
        setHasUnsavedChanges(false);
        const { case: updatedCase } = await response.json();
        setPracticeCase(updatedCase);
        sessionStorage.setItem('lessonsPageNeedsRefresh', 'true');
      }
    } catch (error) {
      console.error("Error publishing practice case:", error);
      setStatusMessage({
        type: 'error',
        message: `Failed to publish practice case: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigate("/instructor/lessons");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this practice case? This action cannot be undone.")) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetchWithAuth(`/api/practice_cases/delete_case/${caseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete practice case");
      }

      setStatusMessage({
        type: 'success',
        message: "Practice case deleted successfully!"
      });
      navigate("/instructor/lessons");
    } catch (err: unknown) {
      console.error("Error deleting practice case:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setStatusMessage({
        type: 'error',
        message: `Failed to delete practice case: ${errorMessage}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/instructor/lessons");
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    const fields = [
      practiceCase?.title,
      practiceCase?.description,
      practiceCase?.target_language,
      practiceCase?.situation_instructions,
      practiceCase?.curricular_goals,
      practiceCase?.behavioral_guidelines,
      practiceCase?.proficiency_level,
      practiceCase?.accessible_on,
      practiceCase?.min_time,
      practiceCase?.max_time
    ];
    
    const completed = fields.filter(field => field && field.toString().trim()).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (isLoading) {
    // Check if it's a new case to show a specific loading message.
    const loadingTitle = isNew ? "Creating New Case" : "Loading...";
    const loadingDescription = isNew ? "Getting the editor ready for your new case." : "Loading practice case...";
    const loadingMessage = isNew ? "Creating new case..." : "Loading practice case...";

    return (
      <ClassAwareLayout title={loadingTitle} description={loadingDescription}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{loadingMessage}</span>
        </div>
      </ClassAwareLayout>
    );
  }

  return (
    <ClassAwareLayout
      title={isNew ? "Create New Practice Case" : "Edit Practice Case"}
      description={isNew 
        ? `Create a new conversation practice scenario for ${selectedClass?.course_code || 'your class'}`
        : `Editing "${practiceCase?.title || 'Practice Case'}" for ${selectedClass?.course_code || 'your class'}`
      }
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/instructor/lessons')}
          variant="outline"
          className="flex items-center space-x-2 bg-white border-gray-300 hover:bg-gray-50"
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
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Practice Case Progress</CardTitle>
                <CardDescription className="text-blue-700">
                  {getCompletionPercentage()}% complete
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAutoSaving && (
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                  Auto-saving...
                </Badge>
              )}
              {hasUnsavedChanges && !isAutoSaving && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Unsaved Changes
                </Badge>
              )}
              {practiceCase?.is_draft && (
                <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                  Draft
                </Badge>
              )}
              {practiceCase?.published && (
                <Badge variant="default" className="text-green-600 border-green-300 bg-green-50">
                  Published
                </Badge>
              )}
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full bg-white border">
              <TabsTrigger value="basics" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Content & Goals</span>
                <span className="sm:hidden">Content</span>
              </TabsTrigger>
              <TabsTrigger value="scenario" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Scenario Setup</span>
                <span className="sm:hidden">Scenario</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">AI Feedback</span>
                <span className="sm:hidden">Feedback</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basics">
              <div className="space-y-6">
                {/* Title and Description */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Edit className="h-5 w-5 text-blue-600" />
                      <span>Case Information</span>
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
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        placeholder="e.g., Ordering at a Restaurant"
                        className="text-base"
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
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Describe what students will practice and what to expect..."
                        className="min-h-[120px] text-base"
                      />
                      <p className="text-sm text-gray-600">
                        Explain the scenario and what students can expect from this practice session
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Time and Access Settings */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-green-600" />
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
                          value={practiceCase ? Math.floor(practiceCase.min_time / 60) : 0}
                          onChange={(e) => {
                            const minutes = Math.max(1, Math.min(30, Number(e.target.value) || 0));
                            handleFieldChange('min_time', minutes * 60);
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
                          value={practiceCase ? Math.floor(practiceCase.max_time / 60) : 0}
                          onChange={(e) => {
                            const minutes = Math.max(1, Math.min(30, Number(e.target.value) || 0));
                            handleFieldChange('max_time', minutes * 60);
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
                        onChange={(e) => handleFieldChange('accessible_on', e.target.value)}
                        className="text-base"
                      />
                      <p className="text-sm text-gray-600">
                        Students will be able to access this practice case starting from this date and time
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Language and Voice Settings */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <span>Language & Voice Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure the language and AI voice for this practice session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-base font-medium">
                        Target Language *
                      </Label>
                      <Select value={practiceCase?.target_language || ""} onValueChange={(value) => handleFieldChange('target_language', value)}>
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

                    <div className="space-y-2">
                      <Label htmlFor="voice" className="text-base font-medium">
                        AI Voice
                      </Label>
                      <Select value={practiceCase?.voice || "verse"} onValueChange={(value) => handleFieldChange('voice', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI voice" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
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
                      
                      {/* Voice Preview Section */}
                      {practiceCase?.voice && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-blue-900">
                                Selected: {voiceOptions.find(v => v.id === practiceCase?.voice)?.name}
                              </h4>
                              <p className="text-xs text-blue-700 truncate">
                                {voiceOptions.find(v => v.id === practiceCase?.voice)?.description}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              // FIX: Remove the disabled prop to enable the button
                              // disabled 
                              onClick={() => playVoicePreview(practiceCase?.voice || "verse")}
                              className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-100 ml-3"
                            >
                              <Volume2 className="h-4 w-4" />
                              <span>Preview</span>
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">
                        The AI voice personality for the conversation partner. Use the preview button to hear each voice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={() => {
                    setActiveTab("content");
                    window.scrollTo(0, 0);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next: Content & Goals
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            {/* Content & Goals Tab */}
            <TabsContent value="content">
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span>Learning Objectives</span>
                    </CardTitle>
                    <CardDescription>
                      Define what students should learn and practice in this session
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
                        onChange={(e) => handleFieldChange('proficiency_level', e.target.value)}
                        placeholder="e.g., Intermediate level students who can form basic sentences but need practice with specific vocabulary..."
                        className="min-h-[100px]"
                      />
                      <p className="text-sm text-gray-600">
                        Describe the expected proficiency level to help the AI adjust difficulty
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goals" className="text-base font-medium">
                        Curricular Goals *
                      </Label>
                      <Textarea
                        id="goals"
                        value={practiceCase?.curricular_goals || ""}
                        onChange={(e) => handleFieldChange('curricular_goals', e.target.value)}
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
                        onChange={(e) => handleFieldChange('key_items', e.target.value)}
                        placeholder="e.g., Menu items, payment methods, customer service expressions, medical considerations..."
                        className="min-h-[120px]"
                      />
                      <p className="text-sm text-gray-600">
                        Important words, phrases, or expressions students should use or encounter
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  onClick={() => {
                    setActiveTab("basics");
                    window.scrollTo(0, 0);
                  }}
                  variant="outline"
                  className="bg-white border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back: Basic Info
                </Button>
                <Button 
                  onClick={() => {
                    setActiveTab("scenario");
                    window.scrollTo(0, 0);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next: Scenario Setup
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            {/* Scenario Setup Tab */}
            <TabsContent value="scenario">
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <span>Conversation Scenario</span>
                    </CardTitle>
                    <CardDescription>
                      Set up the context and guidelines for the AI conversation partner
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="situation" className="text-base font-medium">
                        Situation Instructions *
                      </Label>
                      <Textarea
                        id="situation"
                        value={practiceCase?.situation_instructions || ""}
                        onChange={(e) => handleFieldChange('situation_instructions', e.target.value)}
                        placeholder="e.g., You are a friendly server at a traditional Spanish restaurant. The student is a customer who wants to order food. Be patient and helpful..."
                        className="min-h-[140px]"
                      />
                      <p className="text-sm text-gray-600">
                        Describe the scenario context and the AI's role in the conversation
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="behavioral" className="text-base font-medium">
                        Behavioral Guidelines *
                      </Label>
                      <Textarea
                        id="behavioral"
                        value={practiceCase?.behavioral_guidelines || ""}
                        onChange={(e) => handleFieldChange('behavioral_guidelines', e.target.value)}
                        placeholder="e.g., Be patient with beginners, speak clearly, and use appropriate restaurant terminology..."
                        className="min-h-[140px]"
                      />
                      <p className="text-sm text-gray-600">
                        Define how the AI should behave, including tone, style, and cultural appropriateness
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructor-notes" className="text-base font-medium">
                        Additional Instructor Notes
                      </Label>
                      <Textarea
                        id="instructor-notes"
                        value={practiceCase?.instructor_notes || ""}
                        onChange={(e) => handleFieldChange('instructor_notes', e.target.value)}
                        placeholder="e.g., Focus on politeness expressions and handling misunderstandings gracefully..."
                        className="min-h-[120px]"
                      />
                      <p className="text-sm text-gray-600">
                        Any additional instructions or special considerations for this practice case
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  onClick={() => {
                    setActiveTab("content");
                    window.scrollTo(0, 0);
                  }}
                  variant="outline"
                  className="bg-white border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back: Content & Goals
                </Button>
                <Button 
                  onClick={() => {
                    setActiveTab("feedback");
                    window.scrollTo(0, 0);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next: AI Feedback
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="feedback">
            <FeedbackConfiguration
              key={practiceCase?.id}                     // forces remount when you load a new case
              initialFeedbackPrompt={practiceCase?.feedback_prompt || ''}
              onFeedbackChange={handleFeedbackChange}
            />



              {/* Tab Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  onClick={() => {
                    setActiveTab("scenario");
                    window.scrollTo(0, 0);
                  }}
                  variant="outline"
                  className="bg-white border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back: Scenario Setup
                </Button>
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleSaveDraft}
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
                  {canPublish() && (
                    <Button 
                      onClick={handlePublish}
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
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
                onClick={handleSaveDraft}
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
                onClick={handlePublish}
                disabled={isSaving || !canPublish()}
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

              {/* Updated Validation Status */}
              {!canPublish() ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Required to publish</p>
                      <ul className="text-xs text-amber-700 mt-1 space-y-1">
                        {validateForPublishing().slice(0, 3).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {validateForPublishing().length > 3 && (
                          <li>• And {validateForPublishing().length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : !practiceCase?.published && (
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
                onClick={() => navigate('/instructor/lessons')}
                className="w-full"
                disabled={isSaving}
              >
                Cancel
              </Button>

              {!isNew && (
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
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

          {/* Quick Info */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span>Quick Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium">{selectedClass?.course_code || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Language:</span>
                <span className="font-medium">{practiceCase?.target_language || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Voice:</span>
                <span className="font-medium capitalize">{practiceCase?.voice || 'verse'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {practiceCase?.min_time && practiceCase?.max_time 
                    ? `${Math.floor(practiceCase.min_time / 60)}-${Math.floor(practiceCase.max_time / 60)} min`
                    : 'Not set'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium">
                  {practiceCase?.accessible_on 
                    ? new Date(practiceCase.accessible_on).toLocaleDateString()
                    : 'Not set'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center space-x-1">
                  {practiceCase?.published ? (
                    <Badge variant="default" className="text-green-700 bg-green-100 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  ) : practiceCase?.is_draft ? (
                    <Badge variant="secondary" className="text-gray-700 bg-gray-100 border-gray-300">
                      <Edit className="h-3 w-3 mr-1" />
                      Draft
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-700 bg-yellow-100 border-yellow-300">
                      <XCircle className="h-3 w-3 mr-1" />
                      Unpublished
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
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
        </div>
      </div>
      
      {/* Bottom Actions for Mobile */}
      <div className="xl:hidden border-t pt-6 mt-8">
        <div className="flex flex-col space-y-3">
          {/* Updated Validation Status for Mobile */}
          {!canPublish() ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Required to publish</p>
                  <ul className="text-xs text-amber-700 mt-1 space-y-1">
                    {validateForPublishing().slice(0, 2).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {validateForPublishing().length > 2 && (
                      <li>• And {validateForPublishing().length - 2} more...</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : !practiceCase?.published && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Ready to publish!</p>
                  <p className="text-xs text-green-700 mt-1">
                    All required fields are complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Draft Button - Always first and available */}
          <Button 
            onClick={handleSaveDraft}
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

          {/* Publish Button - Only when validation passes */}
          <Button 
            onClick={handlePublish}
            disabled={isSaving || !canPublish()}
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
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/instructor/lessons')}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            {!isNew && (
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </ClassAwareLayout>
  );
};

export default ReviewCase;