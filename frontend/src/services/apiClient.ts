export const apiClient = {
  createSession: async (userId: number, practiceCaseId: number): Promise<{ client_secret: string; session_id: string }> => {
    try {
      // Send a POST request to the backend to create a session
      const response = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,  // ✅ Pass user_id
          practice_case_id: practiceCaseId,  // ✅ Pass practice_case_id
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
};
