import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, User, Bot, ChevronDown, Play, Info } from "lucide-react";

// Define conversation message structure
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationTranscriptProps {
  transcriptVisible: boolean;
  transcriptCollapsed: boolean;
  conversationTranscript: ConversationMessage[];
  transcriptLoading: boolean;
  userData?: any;
  onToggleTranscript: () => void;
  transcriptRef?: React.RefObject<HTMLDivElement>;
}

const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  transcriptVisible,
  transcriptCollapsed,
  conversationTranscript,
  transcriptLoading,
  userData,
  onToggleTranscript,
  transcriptRef
}) => {
  const [showRecordingNotice, setShowRecordingNotice] = useState(false);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReviewRecording = () => {
    setShowRecordingNotice(true);
  };

  // Render conversation transcript
  const renderTranscript = () => {
    if (transcriptLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading transcript...</span>
        </div>
      );
    }

    if (conversationTranscript.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No conversation transcript available for this session.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Review Recording Button */}
        <div className="border-t border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Recording Review</h3>
              <p className="text-xs text-gray-500">Listen back to your practice session</p>
            </div>
            <button
              onClick={handleReviewRecording}
              className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 hover:border-gray-300 transition-colors flex items-center text-sm font-medium"
            >
              <Play className="w-4 h-4 mr-2" />
              Review Recording
            </button>
          </div>
        </div>

        {/* Recording Notice Modal */}
        {showRecordingNotice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Recording Review Feature Coming Soon
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  We're working on adding audio/video recording review capabilities to help you better understand your communication patterns and improve your practice sessions.
                </p>
                <button
                  onClick={() => setShowRecordingNotice(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Conversation Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {conversationTranscript.map((message, index) => (
            <div key={message.id || index} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {message.role === 'user' ? (
                  userData?.profile_picture ? (
                    <img 
                      src={`/images/profile-icons/${userData.profile_picture}`} 
                      alt="Your profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-medium ${
                    message.role === 'user' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {message.role === 'user' ? 'You' : 'Practice Partner'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className={`text-sm leading-relaxed ${
                  message.role === 'user' ? 'text-gray-700' : 'text-gray-600'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!transcriptVisible) {
    return null;
  }

  return (
    <motion.div 
      ref={transcriptRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <Card className="bg-white">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggleTranscript}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              <div>
                <CardTitle className="text-gray-800">Conversation Review</CardTitle>
                <CardDescription>Review your practice conversation and recording</CardDescription>
              </div>
            </div>
            <motion.div
              animate={{ rotate: transcriptCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>
        </CardHeader>
        
        <motion.div
          initial={false}
          animate={{ 
            height: transcriptCollapsed ? 0 : "auto", 
            opacity: transcriptCollapsed ? 0 : 1 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <CardContent>
            {renderTranscript()}
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default ConversationTranscript;