// Updated Student Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import AbridgedPracticeCases, { PracticeCase } from "@/components/student/Dashboard/AbridgedPracticeCases";
import LatestAIFeedback from "@/components/student/Dashboard/LatestAIFeedback";
import RecentConversation, { Message } from "@/components/student/Dashboard/RecentConversation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  Brain,
  Target,
  Zap,
  MessageSquare,
  BarChart3
} from "lucide-react";
import StudentClassAwareLayout from "@/components/student/StudentClassAwareLayout";
import { useStudentClass } from "@/contexts/StudentClassContext";

const StudentDashboard: React.FC = () => {
  const { selectedClass, apiParams } = useStudentClass();
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [recentTranscript, setRecentTranscript] = useState<Message[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);
  const [hasRecentConversation, setHasRecentConversation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real student stats from API
  const [studentStats, setStudentStats] = useState({
    completedCases: 0,
    totalCases: 0,
    totalConversations: 0,
    totalTimeSpent: 0, // in minutes
    averageTimePerCase: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryString = apiParams.toString();
      
      const [casesResponse, convResponse, progressResponse] = await Promise.all([
        fetchWithAuth(`/api/practice_cases/get_cases${queryString ? `?${queryString}` : ''}`),
        fetchWithAuth(`/api/conversations/conversation/latest${queryString ? `?${queryString}` : ''}`),
        fetchWithAuth(`/api/students/progress${queryString ? `?${queryString}` : ''}`)
      ]);

      const casesData = await casesResponse.json();
      const convData = await convResponse.json();
      const progressData = await progressResponse.json();

      setPracticeCases(casesData);
      setRecentTranscript(convData.messages || []);
      setRecentFeedback(convData.feedback || null);
      
      // Store whether there was a recent conversation (completed or not)
      setHasRecentConversation(convData.conversation_id ? true : false);

      // Calculate student stats from real API data
      const totalTimeInSeconds = progressData.cases?.reduce((sum: number, case_: any) => {
        return sum + (case_.avg_time_spent * case_.times_practiced);
      }, 0) || 0;

      const averageTimePerCase = progressData.cases?.length > 0 
        ? totalTimeInSeconds / progressData.cases.length / 60 // Convert to minutes
        : 0;

      setStudentStats({
        completedCases: progressData.completed_cases || 0,
        totalCases: casesData.length || 0,
        totalConversations: progressData.total_conversations || 0,
        totalTimeSpent: Math.round(totalTimeInSeconds / 60), // Convert to minutes
        averageTimePerCase: Math.round(averageTimePerCase)
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPageDescription = () => {
    if (selectedClass) {
      return `Continue your learning journey in ${selectedClass.course_code}`;
    }
    return "Continue your learning journey across all your classes";
  };

  const getCompletionRate = () => {
    return studentStats.totalCases > 0 
      ? Math.round((studentStats.completedCases / studentStats.totalCases) * 100)
      : 0;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <StudentClassAwareLayout
        title="Dashboard"
        description={getPageDescription()}
      >
        <div className="flex flex-col justify-center items-center h-64 space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 text-center">Loading your dashboard...</span>
        </div>
      </StudentClassAwareLayout>
    );
  }

  return (
    <StudentClassAwareLayout
      title="Dashboard"
      description={getPageDescription()}
    >

      {/* Quick Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Progress at a Glance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Cases Completed</p>
                  <p className="text-2xl font-bold">{studentStats.completedCases}</p>
                  <p className="text-xs text-muted-foreground">of {studentStats.totalCases} available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{getCompletionRate()}%</p>
                  <p className="text-xs text-green-600">
                    {getCompletionRate() >= 75 ? "Excellent progress!" : 
                     getCompletionRate() >= 50 ? "Keep it up!" : 
                     "Just getting started"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">{studentStats.totalConversations}</p>
                  <p className="text-xs text-muted-foreground">Practice sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Time Practiced</p>
                  <p className="text-2xl font-bold">{formatTime(studentStats.totalTimeSpent)}</p>
                  <p className="text-xs text-muted-foreground">
                    {studentStats.averageTimePerCase > 0 ? `${studentStats.averageTimePerCase}m avg per case` : 'Total time spent'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Practice Cases Section */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Practice Cases</h2>
        <AbridgedPracticeCases practiceCases={practiceCases} />
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Recent Activity</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentConversation 
            messages={recentTranscript} 
            hasRecentConversation={hasRecentConversation}
          />
          <LatestAIFeedback feedback={recentFeedback} />
        </div>
      </motion.div>

      {/* Progress Overview Section */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Progress Overview</h2>
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <BarChart3 className="h-5 w-5 mr-2" />
              Learning Journey
            </CardTitle>
            <CardDescription>
              Track your overall progress and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                  <span className="text-sm font-bold text-blue-700">{getCompletionRate()}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${getCompletionRate()}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {studentStats.completedCases} of {studentStats.totalCases} cases completed
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">{studentStats.totalConversations}</div>
                  <div className="text-xs text-gray-600">Total Conversations</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">{studentStats.averageTimePerCase}m</div>
                  <div className="text-xs text-gray-600">Avg Time per Case</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">{formatTime(studentStats.totalTimeSpent)}</div>
                  <div className="text-xs text-gray-600">Total Practice Time</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">
                    {studentStats.totalCases - studentStats.completedCases}
                  </div>
                  <div className="text-xs text-gray-600">Cases Remaining</div>
                </div>
              </div>

              {/* Motivational Message */}
              {getCompletionRate() > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-800">
                    {getCompletionRate() === 100 ? 
                      "🎉 Congratulations! You've completed all available cases!" :
                      getCompletionRate() >= 75 ? 
                      "🌟 You're doing amazing! Keep up the excellent work!" :
                      getCompletionRate() >= 50 ?
                      "💪 Great progress! You're halfway there!" :
                      "🚀 You're off to a great start! Keep practicing!"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StudentClassAwareLayout>
  );
};

export default StudentDashboard;