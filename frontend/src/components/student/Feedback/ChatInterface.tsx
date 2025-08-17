import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Brain, User, Sparkles } from "lucide-react";

interface FeedbackMessage {
  id: number;
  role: "user" | "feedback_assistant";
  content: string;
  timestamp: string;
  is_suggestion?: boolean;
}

interface ChatInterfaceProps {
  messages: FeedbackMessage[];
  suggestions: string[];
  onSendMessage: (message: string, isSuggestion: boolean) => void;
  chatLoading: boolean;
  userProfilePicture?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  suggestions,
  onSendMessage,
  chatLoading,
  userProfilePicture
}) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentMessage.trim() && !chatLoading) {
        onSendMessage(currentMessage, false);
        setCurrentMessage("");
      }
    }
  };

  const handleSendClick = () => {
    if (currentMessage.trim() && !chatLoading) {
      onSendMessage(currentMessage, false);
      setCurrentMessage("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!chatLoading) {
      onSendMessage(suggestion, true);
    }
  };

  // Format message content with proper line breaks
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Check if message is new (for animation)
  const isNewMessage = (index: number) => {
    return index >= previousMessagesLength.current;
  };

  // Update previous length after render
  useEffect(() => {
    previousMessagesLength.current = messages.length;
  });

  return (
    <div className="w-full">
      {/* Messages Area - Clean and simple */}
      <div className="h-[400px] overflow-y-auto p-5 space-y-5 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Brain className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Ready to help!</h3>
              <p className="text-gray-500 max-w-md text-sm">
                Ask me anything about your feedback. I can explain specific points, give tips, or clarify areas for improvement.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={`message-${message.id}`}
              initial={isNewMessage(index) ? { opacity: 0, y: 20, scale: 0.95 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                {/* Avatar - Made smaller */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md overflow-hidden ${
                  message.role === "user" 
                    ? "bg-gray-100" 
                    : "bg-gray-100"
                }`}>
                  {message.role === "user" ? (
                    userProfilePicture ? (
                      <img 
                        src={`/images/profile-icons/${userProfilePicture}`} 
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )
                  ) : (
                    <img 
                      src="/images/profile-icons/lychee.png"
                      alt="AI avatar"
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                  )}
                </div>
                
                {/* Message Bubble - Made more compact */}
                <div className="flex flex-col">
                  <div
                    className={`px-4 py-3 rounded-xl shadow-lg border ${
                      message.role === "user"
                        ? "bg-blue-600 text-white border-blue-300"
                        : "bg-white text-gray-800 border-gray-200"
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {formatMessageContent(message.content)}
                    </div>
                  </div>
                  
                  {/* Message metadata */}
                  <div className={`flex items-center mt-1 text-xs text-gray-400 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}>
                    {message.is_suggestion && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mr-2 text-xs">
                        Quick question
                      </span>
                    )}
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        
        {/* Loading indicator */}
        {chatLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-md overflow-hidden">
                <img 
                  src="/images/profile-icons/lychee.png"
                  alt="AI avatar"
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
              <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions - Made more compact */}
      {suggestions.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Sparkles className="w-3 h-3 text-blue-600 mr-1" />
              <p className="text-xs font-medium text-blue-700">Suggested questions:</p>
            </div>
            {suggestions.length > 3 && (
              <button
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                {showAllSuggestions ? 'Show less' : `Show all (${suggestions.length})`}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(showAllSuggestions ? suggestions : suggestions.slice(0, 3)).map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={chatLoading}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input - Made more compact */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your feedback..."
              disabled={chatLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendClick}
            disabled={chatLoading || !currentMessage.trim()}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px] shadow-lg"
          >
            {chatLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;