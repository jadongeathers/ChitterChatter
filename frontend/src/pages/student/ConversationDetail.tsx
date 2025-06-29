import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  User, 
  Bot, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Timer,
  MessageCircle
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
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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
  const navigate = useNavigate();
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

  const MessageBubble = ({ message, index }: { message: Message; index: number }) => {
    const isUser = message.role === "user";
    
    // Get user profile picture from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const profilePicture = userData.profile_picture_url || userData.profile_picture;
    
    return (
      <motion.div 
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}
      >
        <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
            isUser 
              ? "bg-blue-500" 
              : "bg-green-500"
          }`}>
            {isUser && profilePicture ? (
              <img 
                src={profilePicture} 
                alt="User" 
                className="w-full h-full object-cover"
              />
            ) : isUser ? (
              <User className="h-5 w-5 text-white" />
            ) : (
              <Bot className="h-5 w-5 text-white" />
            )}
          </div>
          
          {/* Message Bubble */}
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-white border border-gray-200 text-gray-800"
          } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            {/* Speaker Label & Timestamp */}
            <div className={`flex items-center justify-between mb-2 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}>
              <span className="text-xs font-medium">
                {isUser ? "You" : "AI Partner"}
              </span>
              <span className="text-xs">
                {new Date(message.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
            
            {/* Message Content */}
            <div className={`text-sm leading-relaxed ${
              isUser ? "text-white" : "text-gray-700"
            }`}>
              {message.content}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading conversation details...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Conversation Not Found</h3>
          <p className="text-gray-500 mb-4">The conversation you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate(-1)} 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Conversation Detail</h1>
                <p className="text-sm text-gray-600">
                  Practice Case: {conversation.practice_case_title}
                </p>
              </div>
            </div>
            
            <Badge className={`${
              conversation.completed 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-amber-100 text-amber-800 border-amber-200"
            }`}>
              {conversation.completed ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  In Progress
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          
          {/* Top Row - Session Overview (Horizontal Cards) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Started</p>
                    <p className="text-sm text-gray-600">{formatDate(conversation.start_time)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {conversation.end_time && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duration</p>
                      <p className="text-sm text-gray-600">
                        {conversation.duration ? formatTime(conversation.duration) : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Messages</p>
                    <p className="text-sm text-gray-600">{conversation.messages?.length || 0} exchanges</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    conversation.completed 
                      ? "bg-green-100" 
                      : "bg-amber-100"
                  }`}>
                    {conversation.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="text-sm text-gray-600">
                      {conversation.completed ? "Completed" : "In Progress"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Conversation Transcript */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-sm h-[700px] flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                    Conversation Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {conversation.messages && conversation.messages.length > 0 ? (
                    <div className="h-full overflow-y-auto pr-2 space-y-1">
                      {conversation.messages.map((message, index) => (
                        <MessageBubble key={message.id} message={message} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transcript Available</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                          This practice session was completed without any conversation exchanges.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - AI Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {conversation.feedback ? (
                <Card className="shadow-sm h-[700px] flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      AI Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-2">
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200 h-full">
                        <div className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                          {conversation.feedback}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm h-[700px] flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-gray-400" />
                      AI Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Feedback Available</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Feedback will be generated once the practice session is completed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetailPage;