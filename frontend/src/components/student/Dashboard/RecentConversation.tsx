// components/student/Dashboard/RecentConversation.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  User, 
  Bot, 
  ArrowRight, 
  Clock, 
  History,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

export interface Message {
  role: string;
  content: string;
}

interface RecentConversationProps {
  messages: Message[];
  hasRecentConversation?: boolean; // New prop to indicate if there was a recent conversation
}

const RecentConversation: React.FC<RecentConversationProps> = ({ 
  messages, 
  hasRecentConversation = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  // Show only last 4 messages in compact view
  const displayMessages = isExpanded ? messages : messages.slice(-4);
  const hasMoreMessages = messages.length > 4;

  const MessageBubble = ({ message, index }: { message: Message; index: number }) => {
    const isUser = message.role === "user";
    
    // Get user profile picture from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const profilePicture = userData.profile_picture_url || userData.profile_picture;
    
    return (
      <motion.div 
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
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
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-white" />
            )}
          </div>
          
          {/* Message Bubble */}
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-white border border-gray-200 text-gray-800"
          } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            {/* Speaker Label */}
            <div className={`text-xs font-medium mb-1 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}>
              {isUser ? "You" : "AI Partner"}
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

  // Determine the empty state based on whether there was a recent conversation
  const getEmptyState = () => {
    if (messages.length === 0 && hasRecentConversation) {
      // There was a conversation but no dialogue
      return {
        icon: <FileText className="h-8 w-8 text-green-500" />,
        iconBg: "bg-green-100",
        title: "No Dialogue in Last Conversation",
        description: "Your most recent practice session was completed without any conversation exchanges.",
        buttonText: "Start New Conversation",
        buttonIcon: <MessageSquare className="h-4 w-4 mr-2" />
      };
    } else {
      // No conversations at all
      return {
        icon: <MessageSquare className="h-8 w-8 text-green-500" />,
        iconBg: "bg-green-100",
        title: "No Conversations Yet",
        description: "Start a practice case to begin your interactive learning experience.",
        buttonText: "Start Your First Conversation",
        buttonIcon: <MessageSquare className="h-4 w-4 mr-2" />
      };
    }
  };

  const emptyState = getEmptyState();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border-0 bg-white h-[600px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b border-green-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-800">Recent Conversation</CardTitle>
                <p className="text-sm text-green-600 mt-1">
                  Your latest practice session dialogue
                </p>
              </div>
            </div>
            
            {messages.length > 0 && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <History className="h-3 w-3 mr-1" />
                {messages.length} messages
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 flex flex-col min-h-0">
          {messages.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-0">
              {hasMoreMessages && !isExpanded && (
                <div className="text-center py-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Show {messages.length - 4} earlier messages
                  </Button>
                </div>
              )}
              
              {/* Messages Container - Fixed height with scroll */}
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
                {displayMessages.map((msg, index) => (
                  <MessageBubble key={index} message={msg} index={index} />
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Full Conversation
                </Button>
                
                {isExpanded && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State - Now dynamic based on hasRecentConversation */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`${emptyState.iconBg} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                  {emptyState.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{emptyState.title}</h3>
                <p className="text-gray-500 mb-4 max-w-sm mx-auto text-sm">
                  {emptyState.description}
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate('/student/practice')}
                >
                  {emptyState.buttonIcon}
                  {emptyState.buttonText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentConversation;