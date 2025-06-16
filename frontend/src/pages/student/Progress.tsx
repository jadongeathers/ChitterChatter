import React, { useState, useEffect } from "react";
import ConversationHistoryTable from "@/components/student/ConversationHistoryTable";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressData {
  total_conversations: number;
  completed_cases: number;
  cases: {
    id: number;
    title: string;
    times_practiced: number;
    avg_time_spent: number;
    completed: boolean;
    conversation_id?: number;
    last_completed?: string;
  }[];
}

// Format seconds into MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.3,
      delayChildren: 0,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
    },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.3 + (i * 0.1), // Stagger rows with increasing delay
      type: "spring",
      damping: 15,
    },
  }),
};

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetchWithAuth("/api/students/progress");
        if (!response.ok) throw new Error("Failed to fetch progress data");

        const data: ProgressData = await response.json();
        setProgressData(data);
      } catch (err) {
        console.error("Error fetching progress data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (isLoading) return <p className="text-center text-gray-500"></p>;

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header - no animation delay */}
      <motion.header 
        className="mb-6" 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-gray-600 mt-1">Track your practice history and improvements over time</p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </motion.header>

      {/* Conversation History - first animated element after header */}
      <motion.div 
        className="mb-6" 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: 0.3, 
          type: "spring",
          damping: 15,
          stiffness: 100,
        }}
      >
        <ConversationHistoryTable />
      </motion.div>

      {/* Summary Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
        <motion.div 
          className="bg-blue-100 p-4 rounded-lg text-center" 
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
        >
          <h2 className="text-lg font-semibold">Completed Conversations</h2>
          <motion.p 
            className="text-3xl font-bold text-blue-600"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
          >
            {progressData?.total_conversations || 0}
          </motion.p>
        </motion.div>
        <motion.div 
          className="bg-green-100 p-4 rounded-lg text-center" 
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
        >
          <h2 className="text-lg font-semibold">Practice Cases Completed</h2>
          <motion.p 
            className="text-3xl font-bold text-green-600"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
          >
            {progressData?.completed_cases || 0}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Progress Table */}
      <motion.div 
        className="overflow-x-auto"
        variants={itemVariants}
      >
        <table className="w-full border-collapse bg-white shadow-md rounded-lg">
          <thead>
            <motion.tr 
              className="bg-gray-200 text-gray-800 text-lg"
              variants={itemVariants}
            >
              <th className="p-4 text-left font-semibold">Practice Case</th>
              <th className="p-4 text-center font-semibold">Times Practiced</th>
              <th className="p-4 text-center font-semibold">Avg. Time Spent</th>
              <th className="p-4 text-center font-semibold">Last Completed</th>
              <th className="p-4 text-center font-semibold">Completed</th>
            </motion.tr>
          </thead>
          <tbody>
            {progressData?.cases.length === 0 ? (
              <motion.tr variants={itemVariants}>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No practice cases found.
                </td>
              </motion.tr>
            ) : (
              progressData?.cases.map((caseData, index) => (
                <motion.tr
                  key={caseData.id}
                  className={`text-center border-t ${
                    caseData.completed ? "cursor-pointer hover:bg-gray-100" : "opacity-50"
                  }`}
                  custom={index}
                  variants={tableRowVariants}
                  whileHover={caseData.completed ? { backgroundColor: "#f3f4f6", scale: 1.01 } : {}}
                  onClick={() => {
                    if (caseData.completed && caseData.conversation_id) {
                      navigate(`/feedback-chat/${caseData.conversation_id}`);
                    }
                  }}
                >
                  <td className="p-4 text-left font-medium">{caseData.title}</td>
                  <td className="p-4">{caseData.times_practiced}</td>
                  <td className="p-4">{formatTime(caseData.avg_time_spent)}</td>
                  <td className="p-4">
                    {caseData.last_completed
                      ? new Date(caseData.last_completed).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-4">
                    {caseData.completed ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.5 + (index * 0.1), type: "spring" }}
                      >
                        <CheckCircle className="text-green-500 h-6 w-6 mx-auto" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.5 + (index * 0.1), type: "spring" }}
                      >
                        <XCircle className="text-red-500 h-6 w-6 mx-auto" />
                      </motion.div>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
};

export default Progress;