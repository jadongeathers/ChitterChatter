// pages/instructor/ReviewCase.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, MessageSquare, Target, Eye, Trash2, Save } from "lucide-react";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";

// Import our new components
import StatusMessage from "@/components/instructor/CaseCreation/shared/StatusMessage";
import ProgressHeader from "@/components/instructor/CaseCreation/shared/ProgressHeader";
import ValidationStatus from "@/components/instructor/CaseCreation/shared/ValidationStatus";
import SaveActionsCard from "@/components/instructor/CaseCreation/sidebar/SaveActionsCard";
import QuickOverviewCard from "@/components/instructor/CaseCreation/sidebar/QuickOverviewCard";
import TipsCard from "@/components/instructor/CaseCreation/sidebar/TipsCard";
import BasicInfoTab from "@/components/instructor/CaseCreation/tabs/BasicInfoTab";
import LearningObjectivesTab from "@/components/instructor/CaseCreation/tabs/LearningObjectivesTab";
import ScenarioSetupTab from "@/components/instructor/CaseCreation/tabs/ScenarioSetupTab";
import FeedbackTab from "@/components/instructor/CaseCreation/tabs/FeedbackTab";

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
  images?: PracticeCaseImage[];
  // optional fields referenced in other tabs
  cultural_context?: string;
  speaking_speed?: "slow" | "normal" | "fast";
  formality_level?: "casual" | "neutral" | "formal";
  response_length?: "brief" | "moderate" | "detailed";
}

interface PracticeCaseImage {
  id: number;
  image_url: string;
}

// Language mapping for OpenAI transcription
const languageCodeMap: Record<string, string> = {
  English: "en",
  Spanish: "es",
  French: "fr",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Dutch: "nl",
  Russian: "ru",
  Japanese: "ja",
  Chinese: "zh",
  Korean: "ko",
  Arabic: "ar",
  Hindi: "hi",
  Tagalog: "tl",
  Vietnamese: "vi",
  Turkish: "tr",
  Polish: "pl",
  Greek: "el",
  Ukrainian: "uk",
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
  { id: "verse", name: "Verse", description: "Expressive, dynamic voice" },
];

const ReviewCase: React.FC<{ isNew?: boolean }> = ({ isNew = false }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const { selectedClass } = useClass();
  const navigate = useNavigate();

  // State management
  const [practiceCase, setPracticeCase] = useState<PracticeCase | null>(null);
  // CHANGE: removed separate feedbackPrompt state — feedback_prompt now lives inside practiceCase
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("basics");

  // CHANGE: refs to avoid stale state in autosave/flush-on-leave
  const practiceCaseRef = useRef<PracticeCase | null>(null);
  const hasUnsavedChangesRef = useRef<boolean>(false);
  const latestFeedbackRef = useRef<string>(""); // last feedback_prompt received from Feedback tab

  useEffect(() => {
    practiceCaseRef.current = practiceCase;
  }, [practiceCase]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Get class_id from URL params or selected class
  const getClassId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlClassId = urlParams.get("class_id");
    if (urlClassId) return parseInt(urlClassId);
    return selectedClass?.class_id || null;
  };

  // CHANGE: handle feedback changes by updating practiceCase directly
  const handleFeedbackChange = (newFeedbackPrompt: string) => {
    latestFeedbackRef.current = newFeedbackPrompt;
    setPracticeCase((prev) => (prev ? { ...prev, feedback_prompt: newFeedbackPrompt } : prev));
    setHasUnsavedChanges(true);
  };

  const handleImageUpdate = (updatedImages: PracticeCaseImage[]) => {
    setPracticeCase((prev) => (prev ? { ...prev, images: updatedImages } : null));
  };

  // Check for success message from URL params (for new case creation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successType = urlParams.get("success");

    if (successType === "draft_saved") {
      setStatusMessage({ type: "success", message: "Draft saved successfully!" });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (successType === "published") {
      setStatusMessage({ type: "success", message: "Practice case published successfully!" });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    if (isNew) {
      const classId = getClassId();
      if (!classId) {
        setStatusMessage({
          type: "error",
          message: "No class selected. Please go back and select a class.",
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
        created_at: new Date().toISOString(),
        feedback_prompt: "", // CHANGE: make it explicit
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
          type: "error",
          message: "Failed to load practice case. Please try again.",
        });
        navigate("/instructor/lessons");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPracticeCase();
  }, [caseId, isNew, selectedClass, navigate]);

  // Auto-save functionality (non-blocking; do NOT overwrite local typing state)
  const autoSaveDraft = useCallback(
    async (override?: PracticeCase) => {
      const data = override ?? practiceCaseRef.current; // CHANGE: allow a snapshot override for flush-on-leave
      if (!data || !hasUnsavedChangesRef.current || isNew || !data.id) return;

      setIsAutoSaving(true);
      try {
        const response = await fetchWithAuth(`/api/practice_cases/update_case/${data.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          // CHANGE: don't force is_draft/published; just send current case as-is
          body: JSON.stringify({
            ...data,
          }),
        });

        if (response.ok) {
          // CHANGE: don't clobber practiceCase from server during autosave
          setHasUnsavedChanges(false);
        } else {
          console.error("Auto-save failed with status:", response.status);
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    },
    [isNew]
  );

  // Auto-save timer
  useEffect(() => {
    if (hasUnsavedChanges && !isNew && practiceCase?.id) {
      const autoSaveTimer = setTimeout(() => {
        autoSaveDraft();
      }, 3000);

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

    setPracticeCase((prev) => (prev ? { ...prev, [field]: value } : null));

    // Update language_code when target_language changes
    if (field === "target_language" && languageCodeMap[value]) {
      setPracticeCase((prev) => (prev ? { ...prev, language_code: languageCodeMap[value] } : null));
    }
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
      const sampleText =
        "Hello! I'm here to help you practice your conversation skills. Let's have a great learning session together.";

      const response = await fetchWithAuth("/api/chatbot/voice/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice: voiceId,
          text: sampleText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice preview");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.play();

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error("Error playing voice preview:", error);
    }
  };

  const handleSaveDraft = async () => {
    if (!practiceCase) return;

    setIsSaving(true);

    try {
      const endpoint = isNew ? "/api/practice_cases/add_case" : `/api/practice_cases/update_case/${caseId}`;
      const method = isNew ? "POST" : "PUT";

      // CHANGE: feedback_prompt already lives on practiceCase; don't duplicate it
      const payload: any = {
        ...practiceCase,
        is_draft: true,
        published: false,
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
        setStatusMessage({ type: "success", message: "Draft saved successfully!" });
        const newCase = await response.json();
        setHasUnsavedChanges(false);
        setPracticeCase(newCase);

        // CHANGE: update URL without remount
        window.history.replaceState({}, "", `/instructor/review/${newCase.id}`);
      } else {
        setStatusMessage({ type: "success", message: "Draft saved successfully!" });
        setHasUnsavedChanges(false);
        const { case: updatedCase } = await response.json();
        setPracticeCase(updatedCase);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setStatusMessage({
        type: "error",
        message: `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
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
        type: "error",
        message: `Cannot publish: ${validationErrors.join(", ")}`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = isNew ? "/api/practice_cases/add_case" : `/api/practice_cases/publish_case/${caseId}`;
      const method = isNew ? "POST" : "PUT";

      const payload: any = {
        ...practiceCase,
        is_draft: false,
        published: true,
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
        setStatusMessage({ type: "success", message: "Publishing new case..." });
        const newCase = await response.json();
        setHasUnsavedChanges(false);

        // CHANGE: update URL without remount
        window.history.replaceState({}, "", `/instructor/review/${newCase.id}?success=published`);
        setPracticeCase(newCase);
      } else {
        setStatusMessage({ type: "success", message: "Practice case published successfully!" });
        setHasUnsavedChanges(false);
        const { case: updatedCase } = await response.json();
        setPracticeCase(updatedCase);
        sessionStorage.setItem("lessonsPageNeedsRefresh", "true");
      }
    } catch (error) {
      console.error("Error publishing practice case:", error);
      setStatusMessage({
        type: "error",
        message: `Failed to publish practice case: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
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

    if (
      !window.confirm("Are you sure you want to delete this practice case? This action cannot be undone.")
    ) {
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
        type: "success",
        message: "Practice case deleted successfully!",
      });
      navigate("/instructor/lessons");
    } catch (err: unknown) {
      console.error("Error deleting practice case:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setStatusMessage({
        type: "error",
        message: `Failed to delete practice case: ${errorMessage}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // CHANGE: flush autosave if leaving Feedback tab or leaving page
  const flushPendingIfAny = useCallback(async () => {
    const current = practiceCaseRef.current;
    if (!current || isNew || !current.id || !hasUnsavedChangesRef.current) return;

    // Ensure latest feedback prompt is included (in case state batching hasn't committed yet)
    const snapshot: PracticeCase = {
      ...current,
      feedback_prompt: latestFeedbackRef.current || current.feedback_prompt || "",
    };
    await autoSaveDraft(snapshot);
  }, [autoSaveDraft, isNew]);

  const handleBackToLessons = async () => {
    await flushPendingIfAny();
    navigate("/instructor/lessons");
  };

  const handleCancel = async () => {
    // CHANGE: cancel also flushes pending autosave
    await flushPendingIfAny();
    navigate("/instructor/lessons");
  };

  // Tab navigation handlers
  const handleTabNavigation = async (tab: string) => {
    // CHANGE: when leaving Feedback tab with unsaved changes, flush immediately
    if (activeTab === "feedback" && tab !== "feedback") {
      await flushPendingIfAny();
    }
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
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
      description={
        isNew
          ? `Create a new conversation practice scenario for ${selectedClass?.course_code || "your class"}`
          : `Editing "${practiceCase?.title || "Practice Case"}" for ${selectedClass?.course_code || "your class"}`
      }
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <Button
          onClick={handleBackToLessons} // CHANGE: flush before leaving
          variant="outline"
          className="flex items-center space-x-2 bg-white border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lessons</span>
        </Button>
      </div>

      {/* Status Message */}
      <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage(null)} />

      {/* Progress Overview */}
      <ProgressHeader
        practiceCase={practiceCase}
        isAutoSaving={isAutoSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3">
          <Tabs value={activeTab} onValueChange={handleTabNavigation} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full bg-white border">
              <TabsTrigger
                value="basics"
                className="flex items-center space-x-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="flex items-center space-x-2 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:border-b-2 data-[state=active]:border-rose-500"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Learning Objectives</span>
                <span className="sm:hidden">Content</span>
              </TabsTrigger>
              <TabsTrigger
                value="scenario"
                className="flex items-center space-x-2 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:border-b-2 data-[state=active]:border-violet-500"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Scenario Setup</span>
                <span className="sm:hidden">Scenario</span>
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">AI Feedback</span>
                <span className="sm:hidden">Feedback</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basics">
              <BasicInfoTab
                practiceCase={practiceCase}
                onFieldChange={handleFieldChange}
                onNext={() => handleTabNavigation("content")}
                languageCodeMap={languageCodeMap}
              />
            </TabsContent>

            {/* Learning Objectives Tab */}
            <TabsContent value="content">
              <LearningObjectivesTab
                practiceCase={practiceCase}
                onFieldChange={handleFieldChange}
                onNext={() => handleTabNavigation("scenario")}
                onPrevious={() => handleTabNavigation("basics")}
              />
            </TabsContent>

            {/* Scenario Setup Tab */}
            <TabsContent value="scenario">
              <ScenarioSetupTab
                practiceCase={practiceCase}
                onFieldChange={handleFieldChange}
                onImageUpdate={handleImageUpdate}
                onNext={() => handleTabNavigation("feedback")}
                onPrevious={() => handleTabNavigation("content")}
                voiceOptions={voiceOptions}
                playVoicePreview={playVoicePreview}
              />
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <FeedbackTab
                practiceCase={practiceCase}
                // CHANGE: only pass the saved prompt from practiceCase; no local fallback
                onFeedbackChange={handleFeedbackChange}
                onPrevious={() => handleTabNavigation("scenario")}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
                isSaving={isSaving}
                canPublish={canPublish()}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
          <SaveActionsCard
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onCancel={handleCancel} // CHANGE: cancel flushes pending autosave
            onDelete={!isNew ? handleDelete : undefined}
            isSaving={isSaving}
            canPublish={canPublish()}
            isNew={isNew}
            validationErrors={validateForPublishing()}
            hasUnsavedChanges={hasUnsavedChanges}
            isAutoSaving={isAutoSaving}
            isPublished={practiceCase?.published}
          />

          {/* Quick Info */}
          <QuickOverviewCard practiceCase={practiceCase} selectedClass={selectedClass} />

          {/* Tips */}
          <TipsCard />
        </div>
      </div>

      {/* Bottom Actions for Mobile */}
      <div className="xl:hidden border-t pt-6 mt-8">
        <div className="flex flex-col space-y-3">
          {/* Validation Status for Mobile */}
          <ValidationStatus
            canPublish={canPublish()}
            validationErrors={validateForPublishing()}
            isPublished={practiceCase?.published}
            isMobile={true}
          />

          {/* Save Draft Button - Always first and available */}
          <Button onClick={handleSaveDraft} disabled={isSaving} variant="outline" className="w-full">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? "Save as Draft" : "Save Changes"}
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
                {isNew ? "Save & Publish" : "Publish Case"}
              </>
            )}
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1" disabled={isSaving}>
              Cancel
            </Button>

            {!isNew && (
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving} className="flex-1">
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
