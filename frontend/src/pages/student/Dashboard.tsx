// pages/student/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import AbridgedPracticeCases, { PracticeCase } from "@/components/student/Dashboard/AbridgedPracticeCases";
import LatestAIFeedback from "@/components/student/Dashboard/LatestAIFeedback";
import RecentConversation, { Message } from "@/components/student/Dashboard/RecentConversation";
import { motion } from "framer-motion";

const StudentDashboard: React.FC = () => {
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [recentTranscript, setRecentTranscript] = useState<Message[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [casesResponse, convResponse] = await Promise.all([
          fetchWithAuth("/api/practice_cases/get_cases"),
          fetchWithAuth("/api/conversations/conversation/latest")
        ]);

        const casesData = await casesResponse.json();
        const convData = await convResponse.json();

        setPracticeCases(casesData);
        setRecentTranscript(convData.messages || []);
        setRecentFeedback(convData.feedback || null);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <p></p>;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header remains here */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-gray-600">View your practice cases and recent activity</p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      {/* Render the dashboard sections */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <AbridgedPracticeCases practiceCases={practiceCases} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <RecentConversation messages={recentTranscript} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <LatestAIFeedback feedback={recentFeedback} />
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
