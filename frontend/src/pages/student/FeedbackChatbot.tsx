import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/utils/api";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationData {
  id: number;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  feedback?: string;
  practice_case_title?: string;
}

const FeedbackChatbot: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation data and initialize chatbot
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!id) return;

      try {
        // Fetch conversation messages
        const messagesResponse = await fetchWithAuth(`/api/conversations/conversation/${id}/messages`);
        const messagesData = await messagesResponse.json();

        // Fetch existing feedback if available
        const feedbackResponse = await fetchWithAuth(`/api/conversations/conversation/${id}/feedback`);
        const feedbackData = await feedbackResponse.json();

        if (messagesResponse.ok) {
          setConversationData({
            id: parseInt(id),
            messages: messagesData.messages || [],
            feedback: feedbackResponse.ok ? feedbackData.feedback : null,
            practice_case_title: messagesData.practice_case_title || "Practice Session"
          });

          // Initialize with welcome message
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: `Hi! I'm your AI feedback assistant. I've reviewed your practice conversation and I'm here to help you improve. You can ask me about:\n\n• Specific parts of your conversation\n• Grammar and pronunciation tips\n• Vocabulary suggestions\n• Overall performance feedback\n\nWhat would you like to know about your practice session?`,
            timestamp: new Date()
          };

          setMessages([welcomeMessage]);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        const errorMessage: Message = {
          id: 'error',
          role: 'assistant',
          content: 'Sorry, I had trouble loading your conversation data. Please try refreshing the page.',
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      }
    };

    fetchConversationData();
  }, [id]);

  // Send message to OpenAI via backend
  const sendMessage = async () => {
  if (!inputValue.trim() || isLoading || !conversationData) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputValue.trim(),
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsLoading(true);

  try {
    // Send to backend endpoint that handles OpenAI API
    const response = await fetchWithAuth('/api/conversations/feedback-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationData.id,
        user_message: userMessage.content,
        conversation_history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        original_conversation: conversationData.messages,
        existing_feedback: conversationData.feedback || '' // Ensure it's always a string
      }),
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') { // Check for success status
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } else {
      throw new Error(data.error || 'Failed to get response');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
    // Focus input after response
    setTimeout(() => inputRef.current?.focus(), 100);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for bullet points and line breaks
    return content.split('\n').map((line, index) => (
      <div key={index} className={line.trim().startsWith('•') ? 'ml-4' : ''}>
        {line.trim() ? line : <br />}
      </div>
    ));
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-[90vw] max-w-4xl h-[85vh] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-500" />
            Interactive Feedback
          </CardTitle>
          <div className="text-sm text-gray-600">
            Talk with the AI chatbot to get personalized feedback and review your conversation!
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 mt-1">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' 
                      : 'bg-gray-100 text-gray-900 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
                  } p-4 shadow-sm`}>
                    <div className="text-sm leading-relaxed">
                      {formatMessageContent(message.content)}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-gray-100 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your conversation, grammar, pronunciation, or any language learning questions..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackChatbot;