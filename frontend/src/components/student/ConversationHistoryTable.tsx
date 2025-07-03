import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  Calendar,
  MessageSquare,
  ExternalLink
} from "lucide-react";

// Helper to format seconds into MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Helper to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        <span className="ml-3 text-gray-600">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-4 text-left font-semibold text-gray-700">Practice Case</th>
            <th className="p-4 text-center font-semibold text-gray-700">Date & Time</th>
            <th className="p-4 text-center font-semibold text-gray-700">Duration</th>
            <th className="p-4 text-center font-semibold text-gray-700">Status</th>
            <th className="p-4 text-center font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {conversations.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-500">
                <div className="space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300" />
                  <div className="text-lg font-medium">No conversations yet</div>
                  <div className="text-sm">Start practicing to see your conversation history here!</div>
                </div>
              </td>
            </tr>
          ) : (
            conversations.map((convo, index) => (
              <motion.tr
                key={convo.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/student/conversations/${convo.id}`)}
              >
                <td className="p-4">
                  <div className="font-medium text-gray-900">{convo.practice_case_title}</div>
                  <div className="text-xs text-gray-500 mt-1">ID: {convo.id}</div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formatDate(convo.start_time)}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {convo.duration ? formatTime(convo.duration) : "N/A"}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {convo.completed ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  )}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="ml-1 text-blue-600 text-sm font-medium">View Details</span>
                  </div>
                </td>
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ConversationHistoryTable;