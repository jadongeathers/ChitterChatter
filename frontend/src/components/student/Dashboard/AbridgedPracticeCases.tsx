// components/student/Dashboard/AbridgedPracticeCases.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PracticeCaseCard from "@/components/student/PracticeCaseCard"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Sparkles, Target, Play } from "lucide-react";
import { motion } from "framer-motion";

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
  const completedCases = practiceCases.filter(c => c.completed);
  const inProgressCases = accessibleCases.filter(c => !c.completed);

  const handleStartCase = (id: number) => {
    navigate(`/practice/${id}`);
  };

  const handleViewAllCases = () => {
    navigate("/practice");
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
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-800">Your Practice Cases</CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  Continue your learning journey with these practice exercises
                </p>
              </div>
            </div>
            
            {accessibleCases.length > 3 && (
              <Button
                onClick={handleViewAllCases}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                View All Cases
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          {practiceCases.length > 0 && (
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {completedCases.length} completed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Play className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {inProgressCases.length} available
                </span>
              </div>
              <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                {practiceCases.length} total {practiceCases.length === 1 ? 'case' : 'cases'}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {practiceCases.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-8"
            >
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Practice Cases Yet</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Your instructor hasn't published any practice cases yet. Check back soon to start your learning journey!
              </p>
            </motion.div>
          ) : recentCases.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-8"
            >
              <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Cases Coming Soon</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                There are {practiceCases.length} practice cases available, but none are accessible yet. Check back later!
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentCases.map((practiceCase, index) => (
                <motion.div key={practiceCase.id} variants={itemVariants} className="relative">
                  {/* New Badge for recently accessible cases */}
                  {practiceCase.accessible_on && 
                   !practiceCase.completed && 
                   new Date(practiceCase.accessible_on).getTime() > Date.now() - 86400000 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        New
                      </Badge>
                    </div>
                  )}
                  
                  {/* Completed Badge */}
                  {practiceCase.completed && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                        ✓ Completed
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

          {/* Call to Action for more cases - more compact */}
          {accessibleCases.length > 3 && (
            <motion.div 
              variants={itemVariants}
              className="mt-6 pt-4 border-t border-gray-100 text-center"
            >
              <p className="text-gray-600 mb-3 text-sm">
                You have {accessibleCases.length - 3} more cases available.
              </p>
              <Button 
                onClick={handleViewAllCases}
                variant="outline"
                className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View All Practice Cases
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AbridgedPracticeCases;