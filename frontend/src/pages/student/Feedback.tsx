import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchWithAuth } from "@/utils/api";

const Feedback: React.FC = () => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"student" | "instructor" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to convert markdown-like formatting to HTML
  const formatMarkdown = (text: string): string => {
    return text
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Headers: # ## ###
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 text-gray-800">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">$1</h1>')
      // Lists: - or *
      .replace(/^[\-\*] (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      // Wrap consecutive list items in ul tags
      .replace(/(<li.*<\/li>\s*)+/g, '<ul class="list-disc list-inside mb-3 space-y-1">$&</ul>')
      // Code blocks: `code`
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      // Line breaks for better spacing
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');
  };

  const fetchUserRole = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/me");
      const userData = await response.json();
      if (!response.ok) {
        throw new Error(userData.error || "Failed to fetch user data");
      }
      setUserRole(userData.is_student ? "student" : "instructor");
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetchWithAuth(`/api/conversations/conversation/${id}/feedback`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch feedback");
        }
        setFeedback(data.feedback);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setFeedback("Failed to retrieve feedback.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
    fetchUserRole();
  }, [id]);

  const handleRedirect = () => {
    if (userRole === "instructor") {
      navigate("/instructor/lessons");
    } else {
      navigate("/student/practice");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Feedback Report
          </h1>
          <p className="text-gray-600">
            Personalized insights to help you improve
          </p>
        </motion.div>

        {/* Feedback Card */}
        {feedback !== null && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Your Performance Analysis
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Generated by AI to help you learn and grow
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="px-8 py-8">
              <div 
                className="prose prose-blue max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-3">${formatMarkdown(feedback || "No feedback available.")}</p>`
                }}
              />
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This feedback is generated by AI and should be used as a learning guide
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(59, 130, 246, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
            onClick={handleRedirect}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-300 flex items-center justify-center"
            onClick={() => window.print()}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Feedback
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Feedback;