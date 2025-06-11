// Updated Student Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import AbridgedPracticeCases, { PracticeCase } from "@/components/student/Dashboard/AbridgedPracticeCases";
import LatestAIFeedback from "@/components/student/Dashboard/LatestAIFeedback";
import RecentConversation, { Message } from "@/components/student/Dashboard/RecentConversation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  Brain,
  Target,
  Zap,
  MessageSquare
} from "lucide-react";
import StudentClassAwareLayout from "@/components/student/StudentClassAwareLayout";
import { useStudentClass } from "@/contexts/StudentClassContext";

const StudentDashboard: React.FC = () => {
  const { selectedClass, apiParams } = useStudentClass();
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [recentTranscript, setRecentTranscript] = useState<Message[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your dashboard...</span>
          {/* Progress Card - Full Width */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-indigo-800">Your Progress</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-900 mb-1">
                    {getCompletionRate()}%
                  </div>
                  <p className="text-sm text-indigo-600">
                    {studentStats.completedCases} of {studentStats.totalCases} cases completed
                  </p>
                </div>
                
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getCompletionRate()}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-indigo-900">{studentStats.totalConversations}</div>
                    <div className="text-indigo-600">Conversations</div>
                  </div>
                  <div>
                    <div className="font-semibold text-indigo-900">{studentStats.averageTimePerCase}m</div>
                    <div className="text-indigo-600">Avg Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </StudentClassAwareLayout>
    );
  }

  return (
    <StudentClassAwareLayout
      title="Dashboard"
      description={getPageDescription()}
    >

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">{studentStats.completedCases}</div>
                  <div className="text-sm text-blue-700">Cases Completed</div>
                  <div className="text-xs text-blue-600">of {studentStats.totalCases} available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">{getCompletionRate()}%</div>
                  <div className="text-sm text-green-700">Completion Rate</div>
                  <div className="text-xs text-green-600">Keep it up!</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">{studentStats.totalConversations}</div>
                  <div className="text-sm text-purple-700">Total Conversations</div>
                  <div className="text-xs text-purple-600">Practice sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-900">{formatTime(studentStats.totalTimeSpent)}</div>
                  <div className="text-sm text-orange-700">Time Practiced</div>
                  <div className="text-xs text-orange-600">
                    {studentStats.averageTimePerCase > 0 ? `${studentStats.averageTimePerCase}m avg per case` : 'Total time spent'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content - Better Layout */}
      <div className="space-y-8">
        
        {/* Practice Cases - Full Width */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <AbridgedPracticeCases practiceCases={practiceCases} />
        </motion.div>

        {/* AI Feedback and Recent Conversation - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <RecentConversation messages={recentTranscript} />
          </motion.div>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <LatestAIFeedback feedback={recentFeedback} />
          </motion.div>
        </div>

        {/* Progress Card - Full Width */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-indigo-800">Your Progress</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-900 mb-1">
                    {getCompletionRate()}%
                  </div>
                  <p className="text-sm text-indigo-600">
                    {studentStats.completedCases} of {studentStats.totalCases} cases completed
                  </p>
                </div>
                
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getCompletionRate()}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-indigo-900">{studentStats.totalConversations}</div>
                    <div className="text-indigo-600">Conversations</div>
                  </div>
                  <div>
                    <div className="font-semibold text-indigo-900">{studentStats.averageTimePerCase}m</div>
                    <div className="text-indigo-600">Avg Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </StudentClassAwareLayout>
  );
};

export default StudentDashboard;