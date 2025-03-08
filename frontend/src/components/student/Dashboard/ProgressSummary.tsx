import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProgressSummaryProps {
  totalConversations: number;
  completedCases: number;
  totalCases: number;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalConversations,
  completedCases,
  totalCases
}) => {
  const navigate = useNavigate();
  const completionPercentage = totalCases > 0 
    ? Math.round((completedCases / totalCases) * 100) 
    : 0;

  return (
    <motion.div 
      className="bg-white rounded-lg shadow p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Your Progress
        </h2>
        <button 
          onClick={() => navigate('/progress')}
          className="text-primary text-sm hover:underline"
        >
          View details
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{totalConversations}</div>
          <div className="text-gray-500 text-sm">Conversations</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold">{completedCases}</div>
          <div className="text-gray-500 text-sm">Cases Completed</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold">{completionPercentage}%</div>
          <div className="text-gray-500 text-sm">Completion</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <motion.div 
          className="bg-primary h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      
      <div className="mt-3 text-sm text-gray-600 flex items-center">
        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
        {completedCases} of {totalCases} practice cases completed
      </div>
    </motion.div>
  );
};

export default ProgressSummary;