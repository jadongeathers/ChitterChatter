import React, { useState, useEffect } from "react";
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
  Edit
} from "lucide-react";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";

interface PracticeCase {
  id: number;
  class_id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on: string;
  system_prompt: string;
  voice: string;
  language_code: string;
  published: boolean;
  created_at?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [activeTab, setActiveTab] = useState("basics");

  // Form fields
  const [language, setLanguage] = useState("");
  const [languageCode, setLanguageCode] = useState("en");
  const [situationInstructions, setSituationInstructions] = useState("");
  const [curricularGoals, setCurricularGoals] = useState("");
  const [keyItems, setKeyItems] = useState("");
  const [behavioralGuidelines, setBehavioralGuidelines] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [instructorNotes, setInstructorNotes] = useState("");
  const [voice, setVoice] = useState("verse");

  // Get class_id from URL params or selected class
  const getClassId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlClassId = urlParams.get('class_id');
    if (urlClassId) return parseInt(urlClassId);
    return selectedClass?.class_id || null;
  };

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
        system_prompt: "",
        voice: "verse",
        language_code: "en",
        published: false,
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
        parseSystemPrompt(data.system_prompt);
        
        if (data.voice) {
          setVoice(data.voice);
        }
        
        if (data.language_code) {
          setLanguageCode(data.language_code);
        }
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

  // Update language code when language changes
  useEffect(() => {
    if (language && languageCodeMap[language]) {
      setLanguageCode(languageCodeMap[language]);
    }
  }, [language]);

  const parseSystemPrompt = (prompt: string) => {
    const languageRegex = /practice their (.*?) skills/;
    const situationRegex = /1\. \*\*Situation Instructions\*\*:\s*([\s\S]*?)\n\s*2\. \*\*Curricular Goals\*\*:/;
    const goalsRegex = /2\. \*\*Curricular Goals\*\*:\s*Your responses should align with the following curricular goals:\s*([\s\S]*?)\n\s*3\. \*\*Key Items to Use\*\*:/;
    const keyItemsRegex = /3\. \*\*Key Items to Use\*\*:\s*Incorporate the following key items into your responses:\s*([\s\S]*?)\n\s*4\. \*\*Behavioral Guidelines\*\*:/;
    const behaviorRegex = /4\. \*\*Behavioral Guidelines\*\*:\s*Respond in a manner consistent with the following behavioral guidelines:\s*([\s\S]*?)\s*Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:/;
    const proficiencyRegex = /Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:\s*([\s\S]*?)\n\s*5\. \*\*Instructor Notes\*\*:/;
    const instructorNotesRegex = /5\. \*\*Instructor Notes\*\*:\s*([\s\S]*)$/;

    const extractedLanguage = (prompt.match(languageRegex)?.[1] || "").trim();
    setLanguage(extractedLanguage);
    setSituationInstructions((prompt.match(situationRegex)?.[1] || "").trim());
    setCurricularGoals((prompt.match(goalsRegex)?.[1] || "").trim());
    setKeyItems((prompt.match(keyItemsRegex)?.[1] || "").trim());
    setBehavioralGuidelines((prompt.match(behaviorRegex)?.[1] || "").trim());
    setProficiencyLevel((prompt.match(proficiencyRegex)?.[1] || "").trim());
    setInstructorNotes((prompt.match(instructorNotesRegex)?.[1] || "").trim());
    
    if (extractedLanguage && languageCodeMap[extractedLanguage]) {
      setLanguageCode(languageCodeMap[extractedLanguage]);
    }
  };

  // Clear status message after delay
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);
  const handleFieldChange = (field: string, value: any) => {
    setHasUnsavedChanges(true);
    
    if (field === 'title' || field === 'description' || field === 'min_time' || field === 'max_time' || field === 'published' || field === 'accessible_on') {
      setPracticeCase(prev => prev ? { ...prev, [field]: value } : null);
    } else if (field === 'language') {
      setLanguage(value);
      if (languageCodeMap[value]) {
        setLanguageCode(languageCodeMap[value]);
      }
    } else if (field === 'voice') {
      setVoice(value);
    } else {
      // Handle text fields
      const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
        situationInstructions: setSituationInstructions,
        curricularGoals: setCurricularGoals,
        keyItems: setKeyItems,
        behavioralGuidelines: setBehavioralGuidelines,
        proficiencyLevel: setProficiencyLevel,
        instructorNotes: setInstructorNotes,
      };
      
      if (setters[field]) {
        setters[field](value);
      }
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

  // Validate form
  const validateForm = () => {
    const errors = [];
    
    if (!practiceCase?.title?.trim()) errors.push("Title is required");
    if (!practiceCase?.description?.trim()) errors.push("Description is required");
    if (!language) errors.push("Target language is required");
    if (!situationInstructions.trim()) errors.push("Situation instructions are required");
    if (!curricularGoals.trim()) errors.push("Curricular goals are required");
    if (!behavioralGuidelines.trim()) errors.push("Behavioral guidelines are required");
    if (!proficiencyLevel.trim()) errors.push("Proficiency level is required");
    if (!practiceCase?.min_time || practiceCase.min_time < 60) errors.push("Minimum time must be at least 1 minute");
    if (!practiceCase?.max_time || practiceCase.max_time < practiceCase.min_time) errors.push("Maximum time must be greater than minimum time");
    if (!practiceCase?.accessible_on) errors.push("Access date and time are required");
    
    return errors;
  };

  const handleSave = async () => {
    if (
      !practiceCase?.title ||
      !practiceCase?.description ||
      !language ||
      !situationInstructions ||
      !curricularGoals ||
      !behavioralGuidelines ||
      !proficiencyLevel ||
      practiceCase?.min_time == null ||
      practiceCase?.max_time == null ||  
      !practiceCase?.accessible_on
    ) {
      setStatusMessage({
        type: 'error',
        message: "Please fill in all required fields."
      });
      return;
    }

    setIsSaving(true);

    const updatedPrompt = `
Your goal is to make an environment for students to practice their ${language} skills. You are a real human with the exact background, personality, and characteristics described below.

You must NEVER break character. Respond exactly as the real person you're portraying would in this situation.

Allow the student to lead the conversation. Your role is to respond naturally, not to guide or direct the interaction.

Your responses should be concise and conversational. Avoid long, detailed explanations unless specifically asked.

Your first response should never ask the student how you can help or what they need assistance with. You are a real person in a specific situation. You should always respond as your character would in a real-life version of this scenario.

If the student has a beginner proficiency level, use simpler vocabulary and speak more slowly, but remain in character (e.g., speak patiently and clearly if that fits your character). 
If the student has an intermediate proficiency level, use moderate complexity in your speech while remaining in character.
If the student has an advanced proficiency level, speak naturally as your character would.

When the conversation begins, immediately assume your character role. 

1. **Situation Instructions**:
${situationInstructions}

2. **Curricular Goals**:
Your responses should align with the following curricular goals:
${curricularGoals}

3. **Key Items to Use**:
Incorporate the following key items into your responses:
${keyItems}

4. **Behavioral Guidelines**:
Respond in a manner consistent with the following behavioral guidelines:
${behavioralGuidelines}

Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:
${proficiencyLevel}

5. **Instructor Notes**:
${instructorNotes}
    `.trim();

    try {
      const endpoint = isNew
        ? "/api/practice_cases/add_case"
        : `/api/practice_cases/update_case/${caseId}`;

      const method = isNew ? "POST" : "PUT";

      const payload: any = {
        title: practiceCase.title,
        description: practiceCase.description,
        system_prompt: updatedPrompt,
        min_time: Math.floor(practiceCase.min_time),
        max_time: Math.floor(practiceCase.max_time),
        accessible_on: practiceCase.accessible_on,
        voice: voice,
        language_code: languageCode,
        published: practiceCase.published || false
      };

      if (isNew) {
        payload.class_id = practiceCase.class_id;
      }

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save practice case");
      }

      setStatusMessage({
        type: 'success',
        message: isNew ? "Practice case created successfully!" : "Changes saved successfully!"
      });
      setHasUnsavedChanges(false);

      if (isNew) {
        const data = await response.json();
        navigate(`/instructor/feedback/${data.id}`);
      }
      // For existing cases, just show success message without redirecting
    } catch (error) {
      console.error("Error saving practice case:", error);
      setStatusMessage({
        type: 'error',
        message: `Failed to save practice case: ${error instanceof Error ? error.message : "Unknown error occurred"}`
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
      language,
      situationInstructions,
      curricularGoals,
      behavioralGuidelines,
      proficiencyLevel,
      practiceCase?.accessible_on,
      practiceCase?.min_time,
      practiceCase?.max_time
    ];
    
    const completed = fields.filter(field => field && field.toString().trim()).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (isLoading) {
    return (
      <ClassAwareLayout title="Loading..." description="Loading practice case...">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading practice case...</span>
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
          variant="ghost" 
          onClick={() => navigate('/instructor/lessons')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
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
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                Unsaved Changes
              </Badge>
            )}
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
            <TabsList className="grid grid-cols-3 w-full bg-white border">
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
                        Choose a clear, descriptive title that tells students what they'll practice
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
                        <Select 
                          value={practiceCase ? Math.floor(practiceCase.min_time / 60).toString() : "0"} 
                          onValueChange={(value) => handleFieldChange('min_time', Number(value) * 60)}
                        >
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select minimum time" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30].map((minutes) => (
                              <SelectItem key={minutes} value={minutes.toString()}>
                                {minutes} minute{minutes !== 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-600">
                          Minimum time students must practice before they can finish
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-time" className="text-base font-medium">
                          Maximum Duration (minutes) *
                        </Label>
                        <Select 
                          value={practiceCase ? Math.floor(practiceCase.max_time / 60).toString() : "0"} 
                          onValueChange={(value) => handleFieldChange('max_time', Number(value) * 60)}
                        >
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select maximum time" />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 25, 30].map((minutes) => (
                              <SelectItem key={minutes} value={minutes.toString()}>
                                {minutes} minute{minutes !== 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-600">
                          Maximum time before the session automatically ends
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
                      <Select value={language} onValueChange={(value) => handleFieldChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target language" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(languageCodeMap).map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{lang}</span>
                                <span className="text-xs text-gray-500">Code: {languageCodeMap[lang]}</span>
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
                      <Select value={voice} onValueChange={(value) => handleFieldChange('voice', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceOptions.map((voiceOption) => (
                            <SelectItem key={voiceOption.id} value={voiceOption.id}>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{voiceOption.name}</span>
                                <span className="text-xs text-gray-500">{voiceOption.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600">
                        The AI voice personality for the conversation partner
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                        value={proficiencyLevel}
                        onChange={(e) => handleFieldChange('proficiencyLevel', e.target.value)}
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
                        value={curricularGoals}
                        onChange={(e) => handleFieldChange('curricularGoals', e.target.value)}
                        placeholder="e.g., Practice food vocabulary, polite requests, and restaurant etiquette..."
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
                        value={keyItems}
                        onChange={(e) => handleFieldChange('keyItems', e.target.value)}
                        placeholder="e.g., Menu items, dietary restrictions, payment methods, table service expressions..."
                        className="min-h-[120px]"
                      />
                      <p className="text-sm text-gray-600">
                        Important words, phrases, or expressions students should use or encounter
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                        value={situationInstructions}
                        onChange={(e) => handleFieldChange('situationInstructions', e.target.value)}
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
                        value={behavioralGuidelines}
                        onChange={(e) => handleFieldChange('behavioralGuidelines', e.target.value)}
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
                        value={instructorNotes}
                        onChange={(e) => handleFieldChange('instructorNotes', e.target.value)}
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
                <span>Save Changes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
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
                    {isNew ? 'Create Practice Case' : 'Save Changes'}
                  </>
                )}
              </Button>
              
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

              {hasUnsavedChanges && (
                <div className="text-sm text-amber-600 flex items-center space-x-2 pt-2 border-t">
                  <AlertCircle className="h-4 w-4" />
                  <span>You have unsaved changes</span>
                </div>
              )}
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
                <span className="font-medium">{language || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Voice:</span>
                <span className="font-medium capitalize">{voice}</span>
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
                <Badge variant={practiceCase?.published ? "default" : "secondary"}>
                  {practiceCase?.published ? "Published" : "Draft"}
                </Badge>
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
                <div>• Keep scenario instructions clear and specific</div>
                <div>• Match time limits to student proficiency level</div>
                <div>• Include cultural context in behavioral guidelines</div>
                <div>• Test your case before making it available</div>
                <div>• Consider real-world conversation dynamics</div>
                <div>• Set realistic expectations for student responses</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Actions for Mobile */}
      <div className="xl:hidden border-t pt-6 mt-8">
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
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
                {isNew ? 'Create Practice Case' : 'Save Changes'}
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