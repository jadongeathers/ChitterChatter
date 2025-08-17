import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Target,
  Lightbulb,
  Brain
} from "lucide-react";

// Define the feedback JSON structure
interface FeedbackJson {
  summary?: {
    strengths?: string[];
    areas_for_improvement?: string[];
  };
  detailed_feedback?: {
    sections?: Array<{
      area: string;
      strengths?: string[];
      areas_for_improvement?: string[];
      tips?: string[];
    }>;
  };
  encouragement?: string;
}

interface FeedbackSummaryProps {
  feedbackJson?: FeedbackJson | null;
  summaryFeedback: string;
}

const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({
  feedbackJson,
  summaryFeedback
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<{[key: string]: Set<string>}>({});

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDetail = (sectionIndex: number, detailType: string) => {
    const sectionKey = `section-${sectionIndex}`;
    const currentDetails = expandedDetails[sectionKey] || new Set();
    const newDetails = new Set(currentDetails);
    
    if (newDetails.has(detailType)) {
      newDetails.delete(detailType);
    } else {
      newDetails.add(detailType);
    }
    
    setExpandedDetails({
      ...expandedDetails,
      [sectionKey]: newDetails
    });
  };

  // Function to convert markdown-like formatting to HTML
  const formatMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 text-gray-800">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">$1</h1>')
      .replace(/^[\-\*] (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/(<li.*<\/li>\s*)+/g, '<ul class="list-disc list-inside mb-3 space-y-1">$&</ul>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');
  };

  // Render structured JSON feedback
  const renderStructuredFeedback = (feedbackData: FeedbackJson) => {
    return (
      <div className="space-y-6">
        {/* Summary Section - Always Visible */}
        {(feedbackData.encouragement || feedbackData.summary?.strengths?.length || feedbackData.summary?.areas_for_improvement?.length) && (
          <div className="space-y-4">
            {/* Encouragement - Comes First */}
            {feedbackData.encouragement && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Brain className="h-5 w-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-purple-800 font-medium">{feedbackData.encouragement}</p>
                </div>
              </div>
            )}

            {/* Strengths and Areas Grid */}
            {(feedbackData.summary?.strengths?.length || feedbackData.summary?.areas_for_improvement?.length) && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                {feedbackData.summary?.strengths?.length && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="flex items-center font-semibold text-green-800 mb-3">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {feedbackData.summary.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2 mt-1">•</span>
                          <span className="text-green-700 text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {feedbackData.summary?.areas_for_improvement?.length && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="flex items-center font-semibold text-blue-800 mb-3">
                      <Target className="h-5 w-5 mr-2" />
                      Areas to Focus On
                    </h3>
                    <ul className="space-y-2">
                      {feedbackData.summary.areas_for_improvement.map((area, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2 mt-1">•</span>
                          <span className="text-blue-700 text-sm">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detailed Sections - Separate Section */}
        {feedbackData.detailed_feedback?.sections?.length && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Let's Dive Deeper</h3>
              {feedbackData.detailed_feedback.sections.length > 3 && (
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-300">
                  {feedbackData.detailed_feedback.sections.length} areas
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Click on any area below to explore specific feedback and recommendations
            </p>
            
            <div className="space-y-3">
              {feedbackData.detailed_feedback.sections.map((section, index) => {
                const isExpanded = expandedSections.has(index);
                const sectionKey = `section-${index}`;
                const detailsExpanded = expandedDetails[sectionKey] || new Set();
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    {/* Section Header - Clickable */}
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          {section.area}
                        </h4>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </button>

                    {/* Section Content - Expandable */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {/* Strengths Dropdown */}
                        {section.strengths?.length && (
                          <div className="border border-green-200 rounded-md overflow-hidden">
                            <button
                              onClick={() => toggleDetail(index, 'strengths')}
                              className="w-full p-3 text-left bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between"
                            >
                              <span className="flex items-center font-medium text-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Strengths ({section.strengths.length})
                              </span>
                              <motion.div
                                animate={{ rotate: detailsExpanded.has('strengths') ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </button>
                            <motion.div
                              initial={false}
                              animate={{ height: detailsExpanded.has('strengths') ? "auto" : 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-white">
                                <ul className="space-y-2">
                                  {section.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="flex items-start text-sm">
                                      <span className="text-green-600 mr-2 mt-1">•</span>
                                      <span className="text-green-700">{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* Areas for Improvement Dropdown */}
                        {section.areas_for_improvement?.length && (
                          <div className="border border-blue-200 rounded-md overflow-hidden">
                            <button
                              onClick={() => toggleDetail(index, 'improvements')}
                              className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between"
                            >
                              <span className="flex items-center font-medium text-blue-700">
                                <Target className="h-4 w-4 mr-2" />
                                Areas to Improve ({section.areas_for_improvement.length})
                              </span>
                              <motion.div
                                animate={{ rotate: detailsExpanded.has('improvements') ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </button>
                            <motion.div
                              initial={false}
                              animate={{ height: detailsExpanded.has('improvements') ? "auto" : 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-white">
                                <ul className="space-y-2">
                                  {section.areas_for_improvement.map((area: string, idx: number) => (
                                    <li key={idx} className="flex items-start text-sm">
                                      <span className="text-blue-600 mr-2 mt-1">•</span>
                                      <span className="text-blue-700">{area}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* Tips Dropdown */}
                        {section.tips?.length && (
                          <div className="border border-purple-200 rounded-md overflow-hidden">
                            <button
                              onClick={() => toggleDetail(index, 'tips')}
                              className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-between"
                            >
                              <span className="flex items-center font-medium text-purple-700">
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Tips & Suggestions ({section.tips.length})
                              </span>
                              <motion.div
                                animate={{ rotate: detailsExpanded.has('tips') ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </button>
                            <motion.div
                              initial={false}
                              animate={{ height: detailsExpanded.has('tips') ? "auto" : 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-white">
                                <ul className="space-y-2">
                                  {section.tips.map((tip: string, idx: number) => (
                                    <li key={idx} className="flex items-start text-sm">
                                      <span className="text-purple-600 mr-2 mt-1">•</span>
                                      <span className="text-purple-700">{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-6">
      {/* Show structured feedback if available, otherwise fallback to text */}
      {feedbackJson ? (
        renderStructuredFeedback(feedbackJson)
      ) : (
        <div 
          className="prose prose-blue max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: `<div>${formatMarkdown(summaryFeedback)}</div>`
          }}
        />
      )}
    </div>
  );
};

export default FeedbackSummary;