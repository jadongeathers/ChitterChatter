import React from "react";
import { useNavigate } from "react-router-dom";
import PracticeCaseCard from "@/components/student/PracticeCaseCard"; 
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on?: string;
  accessible?: boolean;
  completed?: boolean;
}

interface AbridgedPracticeCasesProps {
  practiceCases: PracticeCase[];
}

const AbridgedPracticeCases: React.FC<AbridgedPracticeCasesProps> = ({
  practiceCases,
}) => {
  const navigate = useNavigate();

  // Get only accessible cases
  const accessibleCases = practiceCases.filter(caseData => 
    caseData.accessible !== false
  );
  
  // Prioritize cases: first uncompleted, then by most recent accessible_on date
  const prioritizedCases = [...accessibleCases].sort((a, b) => {
    // First by completion status (uncompleted first)
    if ((a.completed || false) !== (b.completed || false)) {
      return (a.completed || false) ? 1 : -1;
    }
    
    // If both have the same completion status, sort by accessible_on date
    if (a.accessible_on && b.accessible_on) {
      return new Date(b.accessible_on).getTime() - new Date(a.accessible_on).getTime();
    }
    
    // If one doesn't have accessible_on, prioritize it (immediately accessible)
    if (!a.accessible_on) return -1;
    if (!b.accessible_on) return 1;
    
    return 0;
  });

  // Select the 3 most relevant cases
  const recentCases = prioritizedCases.slice(0, 3);

  const handleStartCase = (id: number) => {
    navigate(`/practice/${id}`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Practice Your Next Case
          </h2>
          {practiceCases.length > 0 && (
            <Badge className="ml-2 bg-white text-blue-700 hover:bg-white border border-gray-200">
              {practiceCases.length} {practiceCases.length === 1 ? 'Case' : 'Cases'}
            </Badge>
          )}
        </div>
        
        {accessibleCases.length > 3 && (
          <Button
            onClick={() => navigate("/practice")}
            variant="ghost"
            className="text-blue-500 hover:text-blue-700 p-0 flex items-center gap-1 hover:bg-transparent"
          >
            View all cases
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {practiceCases.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="text-center text-gray-600 text-lg font-medium mb-2">
            No practice cases yet
          </div>
          <p className="text-gray-500">
            Your instructor hasn't published any practice cases yet. Check back soon!
          </p>
        </motion.div>
      ) : recentCases.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="text-center text-gray-600 text-lg font-medium mb-2">
            No accessible cases yet
          </div>
          <p className="text-gray-500">
            There are cases available but none are accessible yet. Check back later!
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentCases.map((practiceCase, index) => (
            <motion.div key={practiceCase.id} variants={itemVariants}>
              {practiceCase.accessible_on && 
               !practiceCase.completed && 
               new Date(practiceCase.accessible_on).getTime() > Date.now() - 86400000 && (
                <div className="flex justify-end mb-1">
                  <Badge className="bg-white text-amber-700 border border-amber-200 flex items-center gap-1 hover:bg-white">
                    <Sparkles className="h-3 w-3" />
                    New
                  </Badge>
                </div>
              )}
              <PracticeCaseCard
                practiceCase={practiceCase}
                onStart={handleStartCase}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AbridgedPracticeCases;