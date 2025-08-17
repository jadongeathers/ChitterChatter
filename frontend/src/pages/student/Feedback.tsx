import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  CheckCircle, 
  MessageSquare, 
  ArrowLeft, 
  Printer,
  Brain,
  TrendingUp,
  FileText
} from "lucide-react";
import { useFeedbackData } from "@/components/student/Feedback/useFeedbackData";
import { useFeedbackChat } from "@/components/student/Feedback/useFeedbackChat";
import ChatInterface from "@/components/student/Feedback/ChatInterface";
import FeedbackSummary from "@/components/student/Feedback/FeedbackSummary";
import ConversationTranscript from "@/components/student/Feedback/ConversationTranscript";

// Define conversation message structure
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const Feedback: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State for UI management
  const [chatStarted, setChatStarted] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [highlightsCollapsed, setHighlightsCollapsed] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(false);

  // State for conversation transcript
  const [conversationTranscript, setConversationTranscript] = useState<ConversationMessage[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  
  // Refs
  const transcriptRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Custom hooks for data and chat functionality
  const {
    summaryFeedback,
    feedbackJson,
    feedbackConversationId,
    dialogicAvailable,
    userRole,
    loading
  } = useFeedbackData(id);

  const {
    messages,
    suggestions,
    chatLoading,
    startChat,
    sendMessage
  } = useFeedbackChat(feedbackConversationId);

  // Get user data from auth
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          const user = await response.json();
          setUserData(user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Fetch conversation transcript
  const fetchTranscript = async () => {
    if (!id) return;
    
    setTranscriptLoading(true);
    try {
      console.log(`🔍 Fetching transcript for conversation ID: ${id}`);
      const response = await fetch(`/api/conversations/conversation/${id}/transcript`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (response.ok) {
        const transcript = await response.json();
        console.log(`✅ Transcript received:`, transcript);
        setConversationTranscript(transcript.messages || []);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch transcript. Status: ${response.status}, Error: ${errorText}`);
      }
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleStartChat = async () => {
    setChatStarted(true);
    await startChat();
    
    // Scroll to chat section after a brief delay to ensure it's rendered
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleShowTranscript = async () => {
    if (!transcriptVisible) {
      await fetchTranscript();
    }
    setTranscriptVisible(true);
    
    // Scroll to transcript section after a brief delay to ensure it's rendered
    setTimeout(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const toggleHighlights = () => {
    setHighlightsCollapsed(!highlightsCollapsed);
  };

  const toggleChat = () => {
    setChatMinimized(!chatMinimized);
  };

  const toggleTranscript = () => {
    setTranscriptCollapsed(!transcriptCollapsed);
  };

  const handleRedirect = () => {
    if (userRole === "instructor") {
      navigate("/instructor/lessons");
    } else {
      navigate("/student/practice");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 text-center">Loading your feedback...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state - no feedback at all
  if (!summaryFeedback) {
    return (
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Card className="max-w-md mx-auto bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl mb-2">No Feedback Available</CardTitle>
              <CardDescription className="mb-6">
                We couldn't find any feedback for this conversation. Please make sure you've completed a practice session.
              </CardDescription>
              <button
                onClick={handleRedirect}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No dialogic feedback available - show basic feedback only
  if (summaryFeedback && !dialogicAvailable) {
    return (
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
              onClick={handleRedirect}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
          </button>

          {/* Notice about dialogic feedback */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-amber-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-amber-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Interactive Feedback Not Available</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      This session doesn't support interactive Q&A, but you can still review your performance summary below.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Feedback */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-800" />
                    <div>
                      <CardTitle className="text-blue-800">Your Practice Highlights</CardTitle>
                      <CardDescription>What stood out in your conversation</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleShowTranscript}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Review Conversation
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Print feedback"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <FeedbackSummary 
                  feedbackJson={feedbackJson}
                  summaryFeedback={summaryFeedback}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Conversation Transcript */}
          {transcriptVisible && (
            <ConversationTranscript
              transcriptVisible={transcriptVisible}
              transcriptCollapsed={transcriptCollapsed}
              conversationTranscript={conversationTranscript}
              transcriptLoading={transcriptLoading}
              userData={userData}
              onToggleTranscript={toggleTranscript}
              transcriptRef={transcriptRef}
            />
          )}
        </div>
      </div>
    );
  }

  // Full dialogic feedback experience
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
            onClick={handleRedirect}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
        </button>

        {/* Summary Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-white">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={toggleHighlights}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-800" />
                  <div>
                    <CardTitle className="text-blue-800">Your Practice Highlights</CardTitle>
                    <CardDescription>Review your performance and ask questions</CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowTranscript();
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Review Conversation
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat();
                    }}
                    disabled={chatLoading || chatStarted}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {chatLoading ? 'Starting...' : chatStarted ? 'Chat Active' : 'Ask Questions'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.print();
                    }}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Print feedback"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <motion.div
                    animate={{ rotate: highlightsCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </CardHeader>
            
            <motion.div
              initial={false}
              animate={{ 
                height: highlightsCollapsed ? 0 : "auto", 
                opacity: highlightsCollapsed ? 0 : 1 
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <CardContent>
                <FeedbackSummary 
                  feedbackJson={feedbackJson}
                  summaryFeedback={summaryFeedback}
                />
              </CardContent>
            </motion.div>
          </Card>
        </motion.div>

        {/* Conversation Transcript */}
        {transcriptVisible && (
          <ConversationTranscript
            transcriptVisible={transcriptVisible}
            transcriptCollapsed={transcriptCollapsed}
            conversationTranscript={conversationTranscript}
            transcriptLoading={transcriptLoading}
            userData={userData}
            onToggleTranscript={toggleTranscript}
            transcriptRef={transcriptRef}
          />
        )}

        {/* Chat Interface */}
        {chatStarted && (
          <motion.div 
            ref={chatRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={toggleChat}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <CardTitle className="text-blue-800">Ask Questions</CardTitle>
                      <CardDescription>Get more insights about your feedback</CardDescription>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: chatMinimized ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </CardHeader>
              
              <motion.div
                initial={false}
                animate={{ 
                  height: chatMinimized ? 0 : "auto", 
                  opacity: chatMinimized ? 0 : 1 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <CardContent className="p-0">
                  <ChatInterface
                    messages={messages}
                    suggestions={suggestions}
                    onSendMessage={sendMessage}
                    chatLoading={chatLoading}
                    userProfilePicture={userData?.profile_picture}
                  />
                </CardContent>
              </motion.div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Feedback;