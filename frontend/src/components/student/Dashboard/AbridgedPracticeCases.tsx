// components/student/Dashboard/AbridgedPracticeCases.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PracticeCaseCard from "@/components/student/PracticeCaseCard"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Sparkles, Target, Play, CheckCircle } from "lucide-react";
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
    navigate("/student/practice");
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
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-slate-800">Practice Cases</CardTitle>
                <CardDescription>
                  Continue your learning journey with these practice exercises
                </CardDescription>
              </div>
            </div>
            
            {accessibleCases.length > 3 && (
              <Button
                onClick={handleViewAllCases}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Quick Stats Row */}
          {practiceCases.length > 0 && (
            <div className="flex items-center gap-6 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {completedCases.length} completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600">
                  <Target className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {inProgressCases.length} in progress
                </span>
              </div>
              <Badge variant="outline" className="border-slate-200 text-xs text-slate-600">
                {practiceCases.length} total
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {practiceCases.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-12"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 p-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-700">No Practice Cases Yet</h3>
              <p className="mx-auto max-w-sm text-sm text-slate-500">
                Your instructor hasn't published any practice cases yet. Check back soon to start your learning journey!
              </p>
            </motion.div>
          ) : recentCases.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-12"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 p-4">
                <BookOpen className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-700">Cases Coming Soon</h3>
              <p className="mx-auto max-w-sm text-sm text-slate-500">
                There are {practiceCases.length} practice cases available, but none are accessible yet. Check back later!
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentCases.map((practiceCase, index) => (
                <motion.div key={practiceCase.id} variants={itemVariants} className="relative">
                  {/* New Badge for recently accessible cases */}
                  {practiceCase.accessible_on && 
                   !practiceCase.completed && 
                   new Date(practiceCase.accessible_on).getTime() > Date.now() - 86400000 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="flex items-center gap-1 border-0 bg-gradient-to-r from-sky-300 to-indigo-400 text-xs text-white shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        New
                      </Badge>
                    </div>
                  )}
                  
                  {/* Completed Badge */}
                  {practiceCase.completed && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-green-600 text-white border-0 shadow-sm text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
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

          {/* View More Section */}
          {accessibleCases.length > 3 && (
            <motion.div 
              variants={itemVariants}
              className="mt-6 border-t border-slate-100 pt-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {accessibleCases.length - 3} more cases available
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Continue your practice with additional exercises
                  </p>
                </div>
                <Button 
                  onClick={handleViewAllCases}
                  variant="outline"
                  size="sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View All Cases
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AbridgedPracticeCases;
