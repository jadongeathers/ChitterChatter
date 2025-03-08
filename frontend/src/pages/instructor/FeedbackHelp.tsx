import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Check, AlertCircle, MessageSquare, HelpCircle, Video, Lightbulb, Users, BarChart3, FileText, ListChecks } from "lucide-react";
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

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Help & Feedback</h1>
        <p className="text-gray-600">Learn how to use the system to monitor student progress and provide your feedback</p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      {statusMessage && (
        <div
          className={`p-4 mb-6 rounded-md ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center">
            <div className={`flex-shrink-0 mr-3 ${
              statusMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {statusMessage.type === 'success' ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm">{statusMessage.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${
                  statusMessage.type === 'success' ? 'text-green-500 hover:bg-green-100' : 
                  'text-red-500 hover:bg-red-100'
                }`}
                onClick={() => setStatusMessage(null)}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content sections with animations matching Dashboard */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="guide" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-white">
              <TabsTrigger value="guide">System Guide</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
          </div>

          {/* GUIDE TAB */}
          <TabsContent value="guide">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      About the Language Practice System
                    </CardTitle>
                    <CardDescription>
                      Welcome to the instructor interface for the language practice system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      This system is designed to provide students with realistic language practice experiences 
                      while giving instructors powerful tools to monitor progress and provide guidance. As an 
                      instructor, you can track student activity, create lesson plans, and analyze 
                      performance data across your classes.
                    </p>
                    <p>
                      The system uses advanced AI to facilitate natural conversations with students in various 
                      scenarios, providing them with immediate feedback while generating comprehensive analytics 
                      for instructors to identify areas where students may need additional support.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-primary" />
                      Key Instructor Features
                    </CardTitle>
                    <CardDescription>
                      Essential tools and features available to instructors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Student Management</h3>
                          <p className="text-gray-600">
                            View student profiles, track participation, and monitor individual progress
                            through the Students section. You can access detailed information about each
                            student's practice history and performance metrics.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Lessons and Practice Cases</h3>
                          <p className="text-gray-600">
                            Manage the practice cases available to your students through the Lessons section.
                            You can view existing cases, understand their learning objectives, and see which 
                            ones are most frequently used by your students.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Analytics Dashboard</h3>
                          <p className="text-gray-600">
                            Access aggregated data about student performance, including average practice time, completion rates, and progress trends. Use these
                            insights to tailor your classroom instruction to address specific needs.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">(COMING SOON) Conversation Review</h3>
                          <p className="text-gray-600">
                            Review transcripts of student conversations to gain deeper insights into their
                            language use, identify patterns in their responses, and understand how they
                            approach different communicative scenarios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Using the Instructor Dashboard
                    </CardTitle>
                    <CardDescription>
                      Navigate and utilize the instructor interface effectively
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4 list-decimal pl-5">
                      <li className="pl-2">
                        <span className="font-semibold block">Dashboard Overview</span>
                        <p className="text-gray-600">
                          The instructor dashboard provides a high-level view of student activity 
                          and system usage. Key metrics include recent student practice sessions,
                          completion rates, and aggregate performance data.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Student Management</span>
                        <p className="text-gray-600">
                          Access the Students section to view individual student profiles, track
                          their progress, and review their conversation history. You can filter
                          students by class, section, or activity level.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Analytics and Reporting</span>
                        <p className="text-gray-600">
                          The Analytics section offers detailed reports on student use.
                          These insights can help inform your classroom instruction.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Lesson Management</span>
                        <p className="text-gray-600">
                          Browse available practice cases in the Lessons section to understand
                          what scenarios students can practice. This helps you align classroom
                          content with practice opportunities.
                        </p>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Video Guide Card - Placeholder for future implementation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Video Guide
                    </CardTitle>
                    <CardDescription>
                      Watch a walkthrough of the instructor features and functions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-8 text-gray-500 italic">
                      Instructor video tutorial coming soon. Check back later for a comprehensive walkthrough.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* FAQ TAB */}
          <TabsContent value="faq">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription>
                      Common questions and answers about using the instructor features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>How do I access student conversation data?</AccordionTrigger>
                        <AccordionContent>
                          You can access student conversation data through the Students section. Select a specific 
                          student, then navigate to their Conversation History. From there, you can view transcripts,
                          AI-generated feedback, and performance metrics for each conversation. You can also access
                          conversations by practice case in the Lessons section.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2">
                        <AccordionTrigger>What types of analytics are available?</AccordionTrigger>
                        <AccordionContent>
                          The system provides a range of analytics including: participation rates by student and 
                          class, common language errors, vocabulary range assessments, fluency metrics, and 
                          progress tracking over time. Most analytics can be filtered by class, section, time 
                          period, and practice case to help you identify specific trends.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Can I export data for my own analysis?</AccordionTrigger>
                        <AccordionContent>
                          Yes, most data views include an export option, typically located in the upper right corner
                          of the screen. You can export data in CSV format for use in spreadsheet applications or 
                          statistical analysis tools. Conversation transcripts can be exported as text files.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-4">
                        <AccordionTrigger>How can I see which students are most active?</AccordionTrigger>
                        <AccordionContent>
                          The Students section includes sorting and filtering options that allow you to rank students
                          by various activity metrics including total conversations, practice time, and most recent
                          activity. The Dashboard also highlights recently active students and those who may need
                          encouragement to participate more.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-5">
                        <AccordionTrigger>Is student data being used for research?</AccordionTrigger>
                        <AccordionContent>
                          Yes, anonymized conversation data is used for research purposes to improve the system.
                          Personal identifying information is separated from the conversation data in research
                          analyses. Students are informed about this when they register, and the system is
                          designed to comply with educational privacy regulations.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-6">
                        <AccordionTrigger>How can I use this system to improve my teaching?</AccordionTrigger>
                        <AccordionContent>
                          The system provides insights that can enhance your teaching in several ways: identify common
                          language challenges across your class, spot individual students who may need additional support,
                          track the effectiveness of your classroom instruction through practice performance, and gain
                          visibility into how students apply language skills in different contexts. These insights can
                          help you tailor lesson plans and provide targeted feedback.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Submit System Feedback
                    </CardTitle>
                    <CardDescription>
                      Share your experience, suggestions, or report issues to help us improve
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Your feedback is invaluable in helping us enhance the language practice system.
                      As an instructor, your perspective on the teaching and monitoring tools is especially
                      important. Please share any thoughts on how we can make the system more effective
                      for you and your students.
                    </p>
                    
                    <Textarea
                      placeholder="Describe your feedback, suggestions, or issues in detail..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-[150px]"
                    />
                    
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting || !feedback.trim()}
                      className="w-full"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default InstructorFeedbackHelp;