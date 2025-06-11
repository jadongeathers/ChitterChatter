import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fetchWithAuth } from "@/utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  AlertCircle, 
  MessageSquare, 
  HelpCircle, 
  Video, 
  Lightbulb,
  Search,
  BookOpen,
  Users,
  Clock,
  Activity,
  Zap,
  PlayCircle,
  FileText,
  Star
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FeedbackHelp: React.FC = () => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetchWithAuth("/api/system/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");
      setStatusMessage({
        type: 'success',
        message: 'Your feedback has been submitted successfully. Thank you for helping us improve!'
      });
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setStatusMessage({
        type: 'error',
        message: 'We encountered an issue submitting your feedback. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock data - replace with real API calls
  const helpStats = {
    totalCases: 24,
    avgSessionLength: "8.5",
    systemUptime: "99.9",
    totalSessions: 1250
  };

  const faqItems = [
    {
      question: "How long should my practice sessions last?",
      answer: "Each practice case has a minimum required time, typically between 5-10 minutes. However, we encourage you to continue conversations as long as they remain productive. The system will indicate when you've reached the minimum required time.",
      category: "sessions"
    },
    {
      question: "What if I don't understand something during the conversation?",
      answer: "It's perfectly fine to ask for clarification! Just like in a real conversation, you can ask the system to repeat information, explain something, or speak more slowly. This is part of natural language practice.",
      category: "conversation"
    },
    {
      question: "How is my performance evaluated?",
      answer: "The system analyzes various aspects of your language use, including vocabulary range, grammatical accuracy, fluency, pronunciation, and communication strategies. The feedback aims to be constructive, highlighting both strengths and areas for improvement.",
      category: "evaluation"
    },
    {
      question: "Can I practice the same scenario multiple times?",
      answer: "Yes! We encourage practicing scenarios multiple times. The conversation will vary slightly each time based on your responses, and you can focus on improving different aspects of your language skills with each attempt.",
      category: "practice"
    },
    {
      question: "Is my practice data being saved?",
      answer: "Yes, your conversation data is saved to help track your progress and provide personalized feedback. This data is also used for research purposes to improve the system, but your personal information remains confidential and secure.",
      category: "privacy"
    },
    {
      question: "What if I have technical issues during a session?",
      answer: "If you encounter technical issues, first try refreshing the page. If problems persist, check your microphone settings and browser permissions. For ongoing issues, please submit feedback through the feedback tab with details about the problem you're experiencing.",
      category: "technical"
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-6 space-y-8">
      {/* Simplified Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Help & Support</h1>
        <p className="text-gray-600">
          Get help using the system and share your feedback to help us improve
        </p>
      </motion.div>

      {/* Status Message */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {statusMessage.type === 'success' ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p className="font-medium">{statusMessage.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>
        </motion.div>
      )}

      {/* Enhanced Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="guide" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-white border">
              <TabsTrigger value="guide" className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Quick Start</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>FAQ</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* QUICK START TAB */}
          <TabsContent value="guide">
            <div className="space-y-6">
              {/* Quick Start Guide */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900">Quick Start Guide</CardTitle>
                      <CardDescription className="text-gray-600">
                        Get up and running in just a few steps
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-3">
                      <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">1. Choose a Case</h3>
                      <p className="text-sm text-gray-600">Browse and select a practice scenario that interests you</p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <PlayCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">2. Start Practicing</h3>
                      <p className="text-sm text-gray-600">Allow microphone access and begin your conversation</p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Star className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">3. Get Feedback</h3>
                      <p className="text-sm text-gray-600">Review AI-generated feedback on your performance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* About ChitterChatter */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      <span>About ChitterChatter</span>
                    </CardTitle>
                    <CardDescription>
                      Your AI-powered language practice companion
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">
                      ChitterChatter provides realistic practice experiences to help you develop language proficiency 
                      through interactive conversations that mirror real-world situations.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Authentic conversation scenarios</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">AI-powered feedback and analysis</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Progress tracking and insights</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Guide */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Video className="h-5 w-5 text-gray-600" />
                      <span>Video Tutorial</span>
                    </CardTitle>
                    <CardDescription>
                      Watch a walkthrough of system features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">Video tutorial coming soon</p>
                      <Button variant="outline" disabled>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Watch Tutorial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Steps */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-700" />
                    <span>Detailed Instructions</span>
                  </CardTitle>
                  <CardDescription>
                    Step-by-step guide to using the system effectively
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      {
                        step: "1",
                        title: "Select a Practice Case",
                        description: "From the Practice page, browse available cases and select one that interests you. Each case has a different scenario and language focus area.",
                        color: "blue"
                      },
                      {
                        step: "2", 
                        title: "Begin the Conversation",
                        description: "When prompted, allow microphone access. The system will guide you through the conversation, responding naturally to your input.",
                        color: "green"
                      },
                      {
                        step: "3",
                        title: "Engage in Natural Conversation", 
                        description: "Speak as you would in a real-life situation. The conversation partner will adapt to your responses, creating an authentic dialogue experience.",
                        color: "purple"
                      },
                      {
                        step: "4",
                        title: "Complete the Minimum Time",
                        description: "Each practice session has a minimum required conversation time. Try to maintain the conversation until you reach this threshold.",
                        color: "orange"
                      },
                      {
                        step: "5", 
                        title: "Review Your Feedback",
                        description: "After completing a session, you'll receive AI-generated feedback on your performance, including strengths and areas for improvement.",
                        color: "red"
                      },
                      {
                        step: "6",
                        title: "Track Your Progress",
                        description: "Visit the Progress page to see your improvement over time, including statistics on completed cases and performance metrics.",
                        color: "indigo"
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex space-x-4">
                        <div className={`bg-${item.color}-100 text-${item.color}-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                          {item.step}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ TAB */}
          <TabsContent value="faq">
            <div className="space-y-6">
              {/* Search Bar */}
              <Card className="p-6 bg-white shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search frequently asked questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Sessions</Badge>
                  <Badge variant="outline" className="text-xs">Technical</Badge>
                  <Badge variant="outline" className="text-xs">Privacy</Badge>
                  <Badge variant="outline" className="text-xs">Evaluation</Badge>
                </div>
              </Card>

              {/* FAQ Content */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span>Frequently Asked Questions</span>
                  </CardTitle>
                  <CardDescription>
                    {filteredFAQ.length} questions found
                    {searchTerm && ` for "${searchTerm}"`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredFAQ.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFAQ.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <span>{item.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No questions found matching your search.</p>
                      <Button 
                        variant="link" 
                        onClick={() => setSearchTerm("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback">
            <div className="space-y-6">
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900">Submit Feedback</CardTitle>
                      <CardDescription className="text-gray-600">
                        Help us improve ChitterChatter with your suggestions and reports
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-6">                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Feedback
                        </label>
                        <Textarea
                          placeholder="Describe your feedback, suggestions, or issues in detail. Include steps to reproduce any problems you encountered..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Tip:</strong> For bug reports, please include your browser version, 
                          operating system, and the specific steps that led to the issue.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmitting || !feedback.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default FeedbackHelp;