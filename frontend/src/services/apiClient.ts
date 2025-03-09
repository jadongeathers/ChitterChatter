// apiClient.ts
import { fetchWithAuth } from "@/utils/api";

export const apiClient = {
  createSession: async (userId: number, practiceCaseId: number): Promise<{ client_secret: string; session_id: string }> => {
    try {
      // Send a POST request to the backend to create a session
      const response = await fetchWithAuth("/api/chatbot/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          practice_case_id: practiceCaseId,
        }),
      });

      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${errorText}`);
      }

      // Parse and return the JSON response
      return response.json();
    } catch (error) {
      console.error("Error in createSession:", error);
      throw error;
    }
  },
  
  endSession: async (sessionId: string): Promise<void> => {
    try {
      const response = await fetchWithAuth(`/api/chatbot/session/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to end session: ${errorText}`);
      }
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }
};