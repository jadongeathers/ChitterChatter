import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";

// Helper to format seconds into MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface Message {
  id: number;
  role: string;
  content: string;
  timestamp: string;
}

interface ConversationDetail {
  id: number;
  practice_case_id: number;
  practice_case_title: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  completed: boolean;
  feedback: string | null;
  messages: Message[];
}

const ConversationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversationDetail = async () => {
      try {
        const response = await fetchWithAuth(`/api/students/conversations/${id}`);
        if (!response.ok) throw new Error("Failed to fetch conversation detail");

        const data: ConversationDetail = await response.json();
        setConversation(data);
      } catch (err) {
        console.error("Error fetching conversation detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversationDetail();
  }, [id]);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading conversation detail...</p>;
  }

  if (!conversation) {
    return <p className="text-center text-gray-500">No conversation detail found.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Conversation Detail</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold">
          Practice Case: {conversation.practice_case_title}
        </h3>
        <p>Start Time: {new Date(conversation.start_time).toLocaleString()}</p>
        {conversation.end_time && (
          <p>End Time: {new Date(conversation.end_time).toLocaleString()}</p>
        )}
        <p>Duration: {conversation.duration ? formatTime(conversation.duration) : "N/A"}</p>
        {conversation.feedback && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="font-semibold">Feedback</h4>
            <p>{conversation.feedback}</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Transcript</h3>
        {conversation.messages && conversation.messages.length > 0 ? (
          <ul className="space-y-2">
            {conversation.messages.map((msg) => (
              <li key={msg.id} className="p-2 border rounded">
                <p className="font-semibold">
                  {msg.role} – {new Date(msg.timestamp).toLocaleString()}
                </p>
                <p>{msg.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No transcript available.</p>
        )}
      </div>
    </div>
  );
};

export default ConversationDetailPage;
