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
  Settings,
  BarChart3,
  Edit,
  GraduationCap
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const InstructorFeedbackHelp: React.FC = () => {
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
        message: 'Your feedback has been submitted successfully. Thank you for helping us improve the instructor experience!'
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

  const faqItems = [
    {
      question: "How do I create effective practice cases for my students?",
      answer: "Focus on realistic scenarios your students will encounter. Include clear situation instructions, specific learning objectives, and appropriate behavioral guidelines. Test your cases before publishing to ensure they work as expected. Consider your students' proficiency level when setting time requirements.",
      category: "creation"
    },
    {
      question: "How can I track my students' progress and engagement?",
      answer: "Use the Students page to monitor individual student activity and the Analytics page to see overall class performance. You can view completion rates, time spent, and identify which practice cases are most effective for your class.",
      category: "monitoring"
    },
    {
      question: "What should I do if students report technical issues?",
      answer: "Common issues include microphone permissions and browser compatibility. Ensure students are using a supported browser (Chrome, Firefox, Safari) and have granted microphone access. Check that practice cases are published and accessible. If issues persist, submit a feedback report with specific details.",
      category: "technical"
    },
    {
      question: "How do I add or remove students from my class?",
      answer: "Go to the Students page and use the 'Add Student' button to invite new students by email. You can remove students using the remove button next to their name. Students who are removed will lose access to class materials but their progress data is preserved.",
      category: "management"
    },
    {
      question: "Can I edit practice cases after students have used them?",
      answer: "Yes, you can edit published practice cases at any time. However, be aware that changes will affect all future student interactions. Existing student data and feedback will not be retroactively changed. Consider creating a new version if you're making major changes.",
      category: "editing"
    },
    {
      question: "How is student performance evaluated by the AI?",
      answer: "The AI analyzes students' language use across multiple dimensions including vocabulary range, grammatical accuracy, fluency, pronunciation, and communication effectiveness. The feedback is designed to be constructive and specific, helping students understand their strengths and areas for improvement.",
      category: "evaluation"
    },
    {
      question: "Can I export student data and analytics?",
      answer: "Yes, both the Students and Analytics pages have export features that download CSV files with relevant data. This includes student engagement metrics, practice case analytics, and performance summaries that you can use for grading or progress tracking.",
      category: "data"
    },
    {
      question: "What's the difference between drafts and published cases?",
      answer: "Draft cases are only visible to you and can be edited freely. Published cases are available to students and should be complete with all required fields filled. You can save drafts at any time and publish them when ready. Only published cases appear in student interfaces.",
      category: "publishing"
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Instructor Help & Support</h1>
        <p className="text-gray-600">
          Learn how to effectively use ChitterChatter in your classroom and share feedback to improve the platform
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

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="guide" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-white border">
              <TabsTrigger value="guide" className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Getting Started</span>
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

          {/* GETTING STARTED TAB */}
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
                      <CardTitle className="text-gray-900">Instructor Quick Start</CardTitle>
                      <CardDescription className="text-gray-600">
                        Set up your class and create practice cases in minutes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-3">
                      <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">1. Add Students</h3>
                      <p className="text-sm text-gray-600">Invite students to your class using their email addresses</p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Edit className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">2. Create Cases</h3>
                      <p className="text-sm text-gray-600">Design practice scenarios tailored to your curriculum</p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">3. Monitor Progress</h3>
                      <p className="text-sm text-gray-600">Track student engagement and analyze performance data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* About ChitterChatter for Instructors */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <span>ChitterChatter for Instructors</span>
                    </CardTitle>
                    <CardDescription>
                      Powerful tools for language educators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">
                      ChitterChatter empowers language instructors to create immersive, AI-driven practice experiences 
                      that complement traditional classroom instruction and provide valuable insights into student progress.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Custom practice scenario creation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Student progress tracking and analytics</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Automated performance feedback</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Guide */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Video className="h-5 w-5 text-gray-600" />
                      <span>Instructor Tutorial</span>
                    </CardTitle>
                    <CardDescription>
                      Watch a complete walkthrough for educators
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">Instructor tutorial coming soon</p>
                      <Button variant="outline" disabled>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Watch Tutorial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Instructor Workflow */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-gray-700" />
                    <span>Complete Instructor Workflow</span>
                  </CardTitle>
                  <CardDescription>
                    Step-by-step guide to using ChitterChatter in your classroom
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      {
                        step: "1",
                        title: "Class Setup and Student Management",
                        description: "Navigate to the Students page to add your students by email. Students will receive access to your class materials automatically. You can add or remove students at any time during the semester.",
                        color: "blue"
                      },
                      {
                        step: "2", 
                        title: "Design Practice Cases",
                        description: "Go to Lessons and create practice cases that align with your curriculum. Define clear scenarios, learning objectives, and behavioral guidelines. Save drafts as you work and publish when ready.",
                        color: "green"
                      },
                      {
                        step: "3",
                        title: "Set Appropriate Difficulty and Time Limits", 
                        description: "Configure minimum and maximum time limits based on your students' proficiency level. Consider the complexity of vocabulary and grammar structures when setting expectations.",
                        color: "purple"
                      },
                      {
                        step: "4",
                        title: "Schedule and Publish Cases",
                        description: "Set accessibility dates for practice cases to align with your lesson plans. Students will only see cases that are published and accessible, giving you full control over the timeline.",
                        color: "orange"
                      },
                      {
                        step: "5", 
                        title: "Monitor Student Activity",
                        description: "Use the Students page to track individual progress and the Analytics page to analyze class-wide performance. Export data for gradebook integration or progress reports.",
                        color: "red"
                      },
                      {
                        step: "6",
                        title: "Review and Iterate",
                        description: "Analyze which practice cases are most effective and modify or create new ones based on student performance data. Use analytics to identify students who may need additional support.",
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
                    placeholder="Search instructor questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Creation</Badge>
                  <Badge variant="outline" className="text-xs">Management</Badge>
                  <Badge variant="outline" className="text-xs">Analytics</Badge>
                  <Badge variant="outline" className="text-xs">Technical</Badge>
                </div>
              </Card>

              {/* FAQ Content */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span>Instructor Frequently Asked Questions</span>
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
                      <CardTitle className="text-gray-900">Submit Instructor Feedback</CardTitle>
                      <CardDescription className="text-gray-600">
                        Help us improve ChitterChatter for educators with your suggestions and reports
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
                          placeholder="Share your experience using ChitterChatter in your classroom. Include suggestions for new features, issues with existing functionality, or ideas for improving the instructor interface..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>We value your input:</strong> As an educator, your feedback helps us understand 
                          how ChitterChatter fits into real classroom environments and what features would be most 
                          valuable for language instruction.
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

export default InstructorFeedbackHelp;