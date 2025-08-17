// services/apiClient.ts
import { fetchWithAuth } from "@/utils/api";

export const apiClient = {
  createSession: async (
    userId: number,
    practiceCaseId: number,
    opts?: { speed?: number } // ← NEW
  ): Promise<{ client_secret: string; session_id: string }> => {
    try {
      const response = await fetchWithAuth("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          practice_case_id: practiceCaseId,
          speed: opts?.speed, // ← NEW
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error in createSession:", error);
      throw error;
    }
  },
};
