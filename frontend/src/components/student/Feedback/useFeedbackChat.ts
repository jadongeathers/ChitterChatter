import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/utils/api";

interface FeedbackMessage {
  id: number;
  role: "user" | "feedback_assistant";
  content: string;
  timestamp: string;
  is_suggestion?: boolean;
}

interface UseFeedbackChatReturn {
  messages: FeedbackMessage[];
  suggestions: string[];
  chatLoading: boolean;
  startChat: () => Promise<void>;
  sendMessage: (message: string, isSuggestion: boolean) => Promise<void>;
}

export const useFeedbackChat = (feedbackConversationId: number | null): UseFeedbackChatReturn => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const startChat = useCallback(async () => {
    if (!feedbackConversationId) {
      console.error("No feedback conversation ID available");
      return;
    }

    try {
      setChatLoading(true);
      
      const response = await fetchWithAuth(`/api/dialogic_feedback/feedback/${feedbackConversationId}/start`, {
        method: "POST"
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start dialogic feedback");
      }

      setMessages(data.messages || []);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error starting dialogic feedback:", err);
      // Show error to user
      alert("Sorry, I couldn't start the chat right now. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }, [feedbackConversationId]);

  const sendMessage = useCallback(async (message: string, isSuggestion: boolean = false) => {
    if (!message.trim() || !feedbackConversationId) return;

    try {
      setChatLoading(true);
      
      // Add user message to UI immediately for better UX
      const userMessage: FeedbackMessage = {
        id: Date.now(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        is_suggestion: isSuggestion
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetchWithAuth(`/api/dialogic_feedback/feedback/${feedbackConversationId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message,
          is_suggestion: isSuggestion
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Update with the complete message history from server
      setMessages(data.messages || []);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove the optimistically added user message and show error
      setMessages(prev => prev.slice(0, -1));
      // Add error message to chat
      const errorMessage: FeedbackMessage = {
        id: Date.now() + 1,
        role: "feedback_assistant",
        content: "I'm sorry, I'm having trouble right now. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  }, [feedbackConversationId]);

  return {
    messages,
    suggestions,
    chatLoading,
    startChat,
    sendMessage
  };
};