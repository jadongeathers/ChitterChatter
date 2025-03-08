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
import { Check, AlertCircle, MessageSquare, HelpCircle, Video, Lightbulb } from "lucide-react";
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
        <h1 className="text-2xl font-bold">Help & System Feedback</h1>
        <p className="text-gray-600">Learn how to use the system and provide your feedback</p>
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
                      About ChitterChatter
                    </CardTitle>
                    <CardDescription>
                      Welcome to your virtual practice partner designed to help improve your language proficiency
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      This system is designed to provide you with realistic practice experiences to help you
                      develop your language proficiency. Through interactive conversations, you'll have the
                      opportunity to practice language skills in authentic scenarios that mirror real-world situations.
                    </p>
                    <p>
                      Each practice case represents a different scenario you might encounter, allowing you to
                      practice specific vocabulary, expressions, and communication strategies relevant to various contexts.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      How to Use the System
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to get the most out of your practice sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4 list-decimal pl-5">
                      <li className="pl-2">
                        <span className="font-semibold block">Select a Practice Case</span>
                        <p className="text-gray-600">
                          From the Practice page, browse available cases and select one that interests you.
                          Each case has a different scenario and language focus area.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Begin the Conversation</span>
                        <p className="text-gray-600">
                          When prompted, allow microphone access. The system will guide you through the 
                          conversation, responding naturally to your input.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Engage in Natural Conversation</span>
                        <p className="text-gray-600">
                          Speak as you would in a real-life situation. The conversation partner will adapt to
                          your responses, creating an authentic dialogue experience.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Complete the Minimum Time</span>
                        <p className="text-gray-600">
                          Each practice session has a minimum required conversation time. Try to maintain the
                          conversation until you reach this threshold.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Review Your Feedback</span>
                        <p className="text-gray-600">
                          After completing a session, you'll receive AI-generated feedback on your performance,
                          including strengths and areas for improvement.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-semibold block">Track Your Progress</span>
                        <p className="text-gray-600">
                          Visit the Progress page to see your improvement over time, including statistics
                          on completed cases and performance metrics.
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
                      Watch a walkthrough of the system features and functions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-8 text-gray-500 italic">
                      Video tutorial coming soon. Check back later for a comprehensive walkthrough.
                    </p>
                    {/* Uncomment when video is ready
                    <div className="aspect-video">
                      <iframe 
                        width="100%" 
                        height="100%"
                        src="https://www.youtube.com/embed/your-video-id" 
                        title="Language Practice System Tutorial" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                    */}
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
                      Common questions and answers about using the language practice system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>How long should my practice sessions last?</AccordionTrigger>
                        <AccordionContent>
                          Each practice case has a minimum required time, typically between 5-10 minutes.
                          However, we encourage you to continue conversations as long as they remain productive.
                          The system will indicate when you've reached the minimum required time.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2">
                        <AccordionTrigger>What if I don't understand something during the conversation?</AccordionTrigger>
                        <AccordionContent>
                          It's perfectly fine to ask for clarification! Just like in a real conversation,
                          you can ask the system to repeat information, explain something, or speak more slowly.
                          This is part of natural language practice.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3">
                        <AccordionTrigger>How is my performance evaluated?</AccordionTrigger>
                        <AccordionContent>
                          The system analyzes various aspects of your language use, including vocabulary range,
                          grammatical accuracy, fluency, pronunciation, and communication strategies. The feedback
                          aims to be constructive, highlighting both strengths and areas for improvement.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-4">
                        <AccordionTrigger>Can I practice the same scenario multiple times?</AccordionTrigger>
                        <AccordionContent>
                          Yes! We encourage practicing scenarios multiple times. The conversation will vary
                          slightly each time based on your responses, and you can focus on improving different
                          aspects of your language skills with each attempt.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-5">
                        <AccordionTrigger>Is my practice data being saved?</AccordionTrigger>
                        <AccordionContent>
                          Yes, your conversation data is saved to help track your progress and provide
                          personalized feedback. This data is also used for research purposes to improve
                          the system, but your personal information remains confidential and secure.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-6">
                        <AccordionTrigger>What if I have technical issues during a session?</AccordionTrigger>
                        <AccordionContent>
                          If you encounter technical issues, first try refreshing the page. If problems persist,
                          check your microphone settings and browser permissions. For ongoing issues, please
                          submit feedback through the feedback tab with details about the problem you're experiencing.
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
                      Your feedback is valuable in helping us enhance the language practice system.
                      Whether you've encountered technical issues, have suggestions for improvement,
                      or want to share your experience, we appreciate your input.
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

export default FeedbackHelp;