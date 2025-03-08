import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";

// Helper to format seconds into MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface Conversation {
  id: number;
  practice_case_id: number;
  practice_case_title: string;
  start_time: string;
  duration: number | null;
  completed: boolean;
  feedback: string | null;
}

const ConversationHistoryTable: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetchWithAuth("/api/students/conversations");
        if (!response.ok) throw new Error("Failed to fetch conversation history");

        const data: Conversation[] = await response.json();
        setConversations(data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (isLoading)
    return <p className="text-center text-gray-500"></p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Conversation History</h2>
      <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-800">
              <th className="p-4 font-semibold text-left">Conversation ID</th>
              <th className="p-4 font-semibold text-left">Practice Case</th>
              <th className="p-4 font-semibold text-left">Start Time</th>
              <th className="p-4 font-semibold text-left">Duration</th>
            </tr>
          </thead>
          <tbody>
            {conversations.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No conversations found.
                </td>
              </tr>
            ) : (
              conversations.map((convo) => (
                <tr
                  key={convo.id}
                  className="border-t cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/conversations/${convo.id}`)}
                >
                  <td className="p-4">{convo.id}</td>
                  <td className="p-4">{convo.practice_case_title}</td>
                  <td className="p-4">{new Date(convo.start_time).toLocaleString()}</td>
                  <td className="p-4">
                    {convo.duration ? formatTime(convo.duration) : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConversationHistoryTable;
