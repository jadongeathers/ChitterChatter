import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchWithAuth } from "@/utils/api"; // Assuming this is your authenticated fetch method

const Feedback: React.FC = () => {
  const { id } = useParams(); // Get conversation ID from URL
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"student" | "instructor" | null>(null);
  const navigate = useNavigate();

  // Fetch the user role
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

  // Fetch feedback from the backend
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
      }
    };

    fetchFeedback();
    fetchUserRole(); // Fetch the role when the component mounts
  }, [id]);

  // Role-based navigation after feedback is viewed
  const handleRedirect = () => {
    if (userRole === "instructor") {
      navigate("/instructor/lessons"); // Redirect instructors to lessons
    } else {
      navigate("/practice"); // Redirect students to practice
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-xl font-bold mb-4">Conversation Feedback</h1>

      {/* Replace your current motion.div for feedback with: */}
      {feedback !== null && (
        <motion.div
          key="feedback"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: 0.3 }}
          className="max-w-lg border rounded-lg shadow-md bg-white p-4"
        >
          <h2 className="text-lg font-semibold mb-2">AI Feedback</h2>
          <p
            className="text-gray-700 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: feedback || "No feedback available." }}
          />
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleRedirect}
      >
        Return to Dashboard
      </motion.button>
    </div>
  );
};

export default Feedback;
