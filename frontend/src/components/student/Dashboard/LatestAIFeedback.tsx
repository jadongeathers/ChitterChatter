// components/student/Dashboard/LatestAIFeedback.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface LatestAIFeedbackProps {
  feedback: string | null;
}

const LatestAIFeedback: React.FC<LatestAIFeedbackProps> = ({ feedback }) => {
  const formatFeedback = (feedback: string) => {
    // Split by markdown bold syntax and render accordingly
    return feedback.split(/\*\*(.*?)\*\*/).map((part, index) =>
      index % 2 === 0 ? (
        <span key={index}>{part}</span>
      ) : (
        <strong className="font-semibold text-purple-800 bg-purple-50 px-1 rounded" key={index}>
          {part}
        </strong>
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border-0 bg-white h-[600px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-100 border-b border-purple-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-purple-800">Latest AI Feedback</CardTitle>
                <p className="text-sm text-purple-600 mt-1">
                  Personalized insights from your most recent practice
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 flex flex-col min-h-0">
          {feedback ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Feedback Content - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-900 mb-2">AI Analysis</h4>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                        {formatFeedback(feedback)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-100 flex-shrink-0">
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800"
                  disabled
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Full Feedback History
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Feedback Yet</h3>
                <p className="text-gray-500 mb-4 max-w-sm mx-auto text-sm">
                  Complete a practice case to receive personalized AI feedback on your performance.
                </p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {/* Navigate to practice cases */}}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Start Your First Practice
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LatestAIFeedback;