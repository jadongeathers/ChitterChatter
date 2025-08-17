import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/utils/api";

interface FeedbackJson {
  summary?: {
    strengths?: string[];
    areas_for_improvement?: string[];
  };
  detailed_feedback?: {
    sections?: Array<{
      area: string;
      strengths?: string[];
      areas_for_improvement?: string[];
      tips?: string[];
    }>;
  };
  encouragement?: string;
}

interface ConversationData {
  conversation_id: number;
  feedback: string;
  feedback_json?: FeedbackJson;
  feedback_conversation_id?: number;
  dialogic_feedback_available?: boolean;
  feedback_version?: string;
  error?: string;
}

interface UseFeedbackDataReturn {
  summaryFeedback: string | null;
  feedbackJson: FeedbackJson | null;
  feedbackConversationId: number | null;
  dialogicAvailable: boolean;
  userRole: "student" | "instructor" | null;
  loading: boolean;
  feedbackVersion: string | null;
}

export const useFeedbackData = (conversationId: string | undefined): UseFeedbackDataReturn => {
  const [summaryFeedback, setSummaryFeedback] = useState<string | null>(null);
  const [feedbackJson, setFeedbackJson] = useState<FeedbackJson | null>(null);
  const [feedbackConversationId, setFeedbackConversationId] = useState<number | null>(null);
  const [dialogicAvailable, setDialogicAvailable] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "instructor" | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackVersion, setFeedbackVersion] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/api/auth/me");
      const userData = await response.json();
      if (!response.ok) {
        throw new Error(userData.error || "Failed to fetch user data");
      }
      setUserRole(userData.is_student ? "student" : "instructor");
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  }, []);

  const fetchConversationData = useCallback(async () => {
    try {
      // First try to get the latest conversation which should include feedback data
      const response = await fetchWithAuth(`/api/conversations/conversation/latest`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error((data as any).error || "Failed to fetch conversation data");
      }

      const conversationData = data as ConversationData;
      
      // Set basic feedback
      setSummaryFeedback(conversationData.feedback);
      setFeedbackVersion(conversationData.feedback_version || null);
      
      // Handle structured JSON feedback if available
      if (conversationData.feedback_json) {
        setFeedbackJson(conversationData.feedback_json);
        console.log("✅ Structured JSON feedback available:", conversationData.feedback_json);
        console.log("📊 JSON sections count:", conversationData.feedback_json?.detailed_feedback?.sections?.length || 0);
        
        // For JSON feedback, prioritize showing the detailed structure over summary text
        // The JSON format is much richer and what instructors configured
      } else {
        console.log("ℹ️ No feedback_json in response, checking other fields...");
        console.log("📋 Available keys:", Object.keys(conversationData));
        console.log("📄 Summary feedback:", conversationData.feedback?.substring(0, 100) + "...");
        setFeedbackJson(null);
      }
      
      // Check if this conversation supports dialogic feedback
      if (conversationData.feedback_conversation_id && conversationData.dialogic_feedback_available) {
        setFeedbackConversationId(conversationData.feedback_conversation_id);
        setDialogicAvailable(true);
        console.log("✅ Dialogic feedback available:", conversationData.feedback_conversation_id);
      } else {
        console.log("ℹ️ Dialogic feedback not available, using fallback");
        
        // Fallback: try the old feedback endpoint for specific conversation
        if (conversationId) {
          try {
            const fallbackResponse = await fetchWithAuth(`/api/conversations/conversation/${conversationId}/feedback`);
            const fallbackData = await fallbackResponse.json();
            if (fallbackResponse.ok) {
              setSummaryFeedback(fallbackData.feedback);
              
              // Check if fallback data includes JSON feedback
              if (fallbackData.feedback_json) {
                setFeedbackJson(fallbackData.feedback_json);
                setFeedbackVersion(fallbackData.feedback_version || null);
              }
            }
          } catch (fallbackErr) {
            console.error("Fallback feedback fetch failed:", fallbackErr);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching conversation data:", err);
      setSummaryFeedback("Failed to retrieve feedback.");
    }
  }, [conversationId]);

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([fetchConversationData(), fetchUserRole()]);
      setLoading(false);
    };
    initializePage();
  }, [fetchConversationData, fetchUserRole]);

  return {
    summaryFeedback,
    feedbackJson,
    feedbackConversationId,
    dialogicAvailable,
    userRole,
    loading,
    feedbackVersion
  };
};