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
  Star,
  Mic,
  Volume2,
  Headphones,
  TrendingUp,
  Award,
  Target,
  Settings
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const StudentHelpPage: React.FC = () => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetchWithAuth("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");
      setStatusMessage({
        type: 'success',
        message: 'Your feedback has been submitted successfully. Thank you for helping us improve your learning experience!'
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

  const studentFaqItems = [
    {
      question: "How do I start my first practice session?",
      answer: "Go to the Practice page, choose a conversation scenario that interests you, then click 'Start Practice'. Make sure your microphone is enabled when prompted. The AI conversation partner will guide you through an interactive dialogue.",
      category: "getting-started"
    },
    {
      question: "What should I do if my microphone isn't working?",
      answer: "First, check that your browser has microphone permissions enabled for this site. You can usually find this in your browser's address bar or settings. Make sure no other applications are using your microphone, and try refreshing the page if issues persist.",
      category: "technical"
    },
    {
      question: "How long should I practice each day?",
      answer: "We recommend starting with 15-30 minutes daily. Each conversation scenario has a minimum time requirement (usually 5-10 minutes), but feel free to continue longer if you're engaged. Consistency is more important than duration - daily practice yields better results than occasional long sessions.",
      category: "practice-tips"
    },
    {
      question: "How do I understand my performance scores?",
      answer: "Your scores reflect different aspects of your language skills: Fluency (how smoothly you speak), Accuracy (grammar and vocabulary use), Pronunciation (clarity of speech), and Communication (how effectively you convey your message). Check your Progress page for detailed breakdowns and trends over time.",
      category: "progress"
    },
    {
      question: "Can I repeat practice scenarios?",
      answer: "Absolutely! Repeating scenarios is highly encouraged. Each conversation will be slightly different based on your responses, allowing you to practice different vocabulary and improve specific skills. You can compare your scores across attempts to track improvement.",
      category: "practice-tips"
    },
    {
      question: "What if I don't understand what the AI is saying?",
      answer: "Just ask for clarification - say things like 'Could you repeat that?', 'Can you speak more slowly?', or 'I don't understand, can you explain?'. This is part of natural conversation practice and the AI will adapt to help you.",
      category: "conversation"
    },
    {
      question: "How is my data being used?",
      answer: "Your practice conversations are securely stored to track your progress and provide personalized feedback. Your data may also be used for research to improve the learning system, but all personal information remains confidential and anonymized for research purposes.",
      category: "privacy"
    },
    {
      question: "Why am I getting low scores even though I'm trying hard?",
      answer: "Language learning is a gradual process - don't be discouraged by initial scores! Focus on one skill at a time (like speaking more slowly for better pronunciation), practice regularly, and celebrate small improvements. The AI feedback will highlight specific areas to work on.",
      category: "motivation"
    },
    {
      question: "What's the best way to use the feedback I receive?",
      answer: "Read through your feedback carefully and focus on 1-2 specific suggestions per practice session. For example, if feedback mentions using more varied vocabulary, try incorporating new words in your next conversation. Keep notes on your improvement goals.",
      category: "learning-strategy"
    },
    {
      question: "Can I practice with friends or in groups?",
      answer: "Currently, the system is designed for individual practice with AI conversation partners. However, you can share your progress with friends and even practice the same scenarios to compare experiences and learn from each other offline.",
      category: "social"
    }
  ];

  const filteredFAQ = studentFaqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick tips for students
  const quickTips = [
    {
      icon: <Mic className="h-5 w-5" />,
      title: "Speak Clearly",
      description: "Find a quiet space and speak at a normal volume for best results",
      color: "blue"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Practice Daily",
      description: "Even 15 minutes daily is better than one long weekly session",
      color: "green"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Set Goals",
      description: "Focus on one skill per session - fluency, vocabulary, or pronunciation",
      color: "purple"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Track Progress",
      description: "Check your Progress page regularly to see improvement trends",
      color: "orange"
    }
  ];

  return (
    <div className="w-full px-6 py-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Help & Support</h1>
        <p className="text-gray-600">
          Get help with your language practice and share feedback to improve your learning experience
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

      {/* Main Content Tabs */}
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
              {/* Welcome Card */}
              <Card className="shadow-lg border-0 ">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900">Welcome to ChitterChatter</CardTitle>
                      <CardDescription className="text-gray-600">
                        Your AI-powered conversation practice partner
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-gray-700 mb-4">
                    ChitterChatter helps you improve your language skills through realistic conversations. 
                    Practice anytime, get instant feedback, and track your progress as you become more confident in your communication.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Real conversation practice</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Instant AI feedback</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Progress tracking</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Flexible scheduling</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Start Steps */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900">Get Started in 3 Steps</CardTitle>
                      <CardDescription className="text-gray-600">
                        Begin practicing in just a few minutes
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
                      <h3 className="font-semibold text-gray-900">1. Choose Your Practice</h3>
                      <p className="text-sm text-gray-600">Browse conversation scenarios and pick one that matches your interests or learning goals</p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Mic className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">2. Start Talking</h3>
                      <p className="text-sm text-gray-600">Enable your microphone and begin a natural conversation with your AI partner</p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">3. Get Feedback</h3>
                      <p className="text-sm text-gray-600">Receive detailed feedback and track your improvement over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    <span>Success Tips</span>
                  </CardTitle>
                  <CardDescription>
                    Make the most of your practice sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickTips.map((tip, index) => (
                      <div key={index} className="flex space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className={`text-${tip.color}-600 flex-shrink-0 mt-1`}>
                          {tip.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{tip.title}</h4>
                          <p className="text-gray-600 text-sm">{tip.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Guide */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-700" />
                    <span>Complete Guide</span>
                  </CardTitle>
                  <CardDescription>
                    Everything you need to know about using ChitterChatter effectively
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      {
                        step: "1",
                        title: "Explore Practice Scenarios",
                        description: "Visit the Practice page to see available conversation topics. Each scenario focuses on different situations like job interviews, casual conversations, or specific topics. Choose based on your learning goals or interests.",
                        color: "blue"
                      },
                      {
                        step: "2", 
                        title: "Set Up Your Environment",
                        description: "Find a quiet space with good internet connection. Test your microphone and ensure browser permissions are enabled. Use headphones if possible to improve audio quality and reduce echo.",
                        color: "green"
                      },
                      {
                        step: "3",
                        title: "Start Your Conversation", 
                        description: "Click 'Start Practice' and begin speaking naturally. The AI will respond contextually to your words. Don't worry about perfection - focus on communicating your ideas clearly.",
                        color: "purple"
                      },
                      {
                        step: "4",
                        title: "Practice Active Conversation",
                        description: "Engage naturally - ask questions, share opinions, and respond to the AI's prompts. If you need clarification, just ask! This mirrors real conversation and helps build confidence.",
                        color: "orange"
                      },
                      {
                        step: "5", 
                        title: "Review Your Performance",
                        description: "After each session, carefully read the AI feedback. It covers pronunciation, grammar, vocabulary use, and communication effectiveness. Take notes on key improvement areas.",
                        color: "red"
                      },
                      {
                        step: "6",
                        title: "Track Your Progress",
                        description: "Visit your Progress page regularly to see trends in your scores. Celebrate improvements and identify areas that need more practice. Set weekly goals to stay motivated.",
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

              {/* Technical Setup */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span>Technical Setup</span>
                  </CardTitle>
                  <CardDescription>
                    Ensure your device is ready for optimal practice sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <Headphones className="h-4 w-4 mr-2" />
                        Audio Setup
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use headphones or earbuds to prevent audio feedback</li>
                        <li>• Test your microphone before starting practice</li>
                        <li>• Ensure browser has microphone permissions enabled</li>
                        <li>• Find a quiet environment to minimize background noise</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Browser Requirements
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Use Chrome, Firefox, Safari, or Edge (latest versions)</li>
                        <li>• Enable JavaScript and cookies</li>
                        <li>• Stable internet connection recommended</li>
                        <li>• Close unnecessary browser tabs for better performance</li>
                      </ul>
                    </div>
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
                  <Badge variant="outline" className="text-xs">Getting Started</Badge>
                  <Badge variant="outline" className="text-xs">Technical</Badge>
                  <Badge variant="outline" className="text-xs">Practice Tips</Badge>
                  <Badge variant="outline" className="text-xs">Progress</Badge>
                  <Badge variant="outline" className="text-xs">Motivation</Badge>
                </div>
              </Card>

              {/* FAQ Content */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span>Student FAQ</span>
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
                      <CardTitle className="text-gray-900">Share Your Feedback</CardTitle>
                      <CardDescription className="text-gray-600">
                        Help us improve your learning experience with your suggestions and reports
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
                          placeholder="Share your experience, suggestions, or report any issues you've encountered. For technical problems, please include what you were doing when the issue occurred..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>💡 Helpful feedback includes:</strong> Specific scenarios where you encountered issues, 
                          suggestions for new practice topics, thoughts on the feedback quality, or ideas for improving 
                          the learning experience.
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

              {/* Contact Info */}
              <Card className="shadow-lg border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span>Need More Help?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    If you need immediate assistance or have urgent technical issues, you can also reach out to your instructor 
                    or check if there are any system announcements on your dashboard.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>We typically respond within 24 hours</span>
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

export default StudentHelpPage;