import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  Clock, 
  UserPlus, 
  ArrowRight, 
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
  Plus,
  Eye,
  Edit,
  MessageSquare,
  Target,
  Mail,
  X
} from "lucide-react";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";

interface Student {
  id: number;
  name: string;
  email: string;
  sessionsCompleted: number;
  lastActive: string;
}

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  studentsUsed?: number;
  completionRate?: number;
}

const InstructorDashboard: React.FC = () => {
  const { selectedClass, apiParams } = useClass();
  const [studentEngagement, setStudentEngagement] = useState<Student[]>([]);
  const [recentPracticeCases, setRecentPracticeCases] = useState<PracticeCase[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedClass]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const queryString = apiParams.toString();
      
      const [
        engagementRes, 
        practiceRes, 
        analyticsRes
      ] = await Promise.all([
        fetchWithAuth(`/api/instructors/students/engagement${queryString ? `?${queryString}` : ''}`),
        fetchWithAuth(`/api/practice_cases/get_cases${queryString ? `?${queryString}` : ''}`),
        fetchWithAuth(`/api/instructors/analytics${queryString ? `?${queryString}` : ''}`)
      ]);

      const engagementData = await engagementRes.json();
      const practiceData = await practiceRes.json();
      const analyticsDataResponse = await analyticsRes.json();

      setStudentEngagement(engagementData);
      setStudentCount(engagementData.length);
      
      const activeCount = engagementData.filter(
        (student: Student) => student.sessionsCompleted > 0
      ).length;
      setActiveStudents(activeCount);
      
      setRecentPracticeCases(practiceData.slice(0, 3));
      setCaseCount(practiceData.length);
      
      const sortedAnalytics = analyticsDataResponse.sort(
        (a: any, b: any) => b.studentsUsed - a.studentsUsed
      ).slice(0, 3);
      setAnalyticsData(sortedAnalytics);
      
    } catch (error) {
      console.error("Failed to fetch instructor dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToStudents = () => navigate("/instructor/students");
  const navigateToLessons = () => navigate("/instructor/lessons");
  const navigateToAnalytics = () => navigate("/instructor/analytics");
  
  const navigateToAddCase = () => {
    const route = selectedClass 
      ? `/instructor/review/new?class_id=${selectedClass.class_id}`
      : "/instructor/review/new";
    navigate(route);
  };

  const getPageDescription = () => {
    if (selectedClass) {
      return `Overview and quick actions for ${selectedClass.course_code}`;
    }
    return "Overview and quick actions across all your classes";
  };

  const getEngagementRate = () => {
    return studentCount > 0 ? Math.round((activeStudents / studentCount) * 100) : 0;
  };

  const getEngagementColor = () => {
    const rate = getEngagementRate();
    if (rate >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTotalSessionsCompleted = () => {
    if (!Array.isArray(studentEngagement)) return 0;
    return studentEngagement.reduce((sum, student) => sum + student.sessionsCompleted, 0);
  };

  const getMostActivePeriod = () => {
    // This would ideally come from analytics, but for now we'll show a placeholder
    return "This Week";
  };

  const getRecentActivityCount = () => {
    if (!Array.isArray(studentEngagement)) return 0;
    // Count students active in last 7 days (this is simplified - in real app you'd check actual dates)
    return studentEngagement.filter(student => 
      student.lastActive && student.lastActive !== "Never" && student.lastActive !== "No activity"
    ).length;
  };

  const getPublishedCasesCount = () => {
    if (!Array.isArray(recentPracticeCases)) return 0;
    // This would ideally come from the full practice cases data with published status
    return Math.floor(caseCount * 0.8); // Approximation for demo
  };

  const formatDisplayName = (name: string) => {
    const [lastName, firstName] = name.split(" ").reverse();
    return lastName && firstName ? `${lastName}, ${firstName}` : name;
  };

  return (
    <ClassAwareLayout
      title="Dashboard"
      description={getPageDescription()}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Enhanced Stats Overview */}
          <div className="mb-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{studentCount}</div>
                      <div className="text-sm text-blue-700">Total Students</div>
                      <div className="text-xs text-blue-600">{getRecentActivityCount()} recently active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">{getTotalSessionsCompleted()}</div>
                      <div className="text-sm text-green-700">Total Sessions</div>
                      <div className="text-xs text-green-600">Across all students</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">{getPublishedCasesCount()}</div>
                      <div className="text-sm text-purple-700">Published Cases</div>
                      <div className="text-xs text-purple-600">{caseCount} total cases</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-900">
                        {getEngagementRate()}%
                      </div>
                      <div className="text-sm text-orange-700">
                        Engagement Rate
                      </div>
                      <div className="text-xs text-orange-600">
                        {activeStudents} of {studentCount} active
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          
            {/* Quick Actions Panel */}
            <Card className="p-6 bg-white shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <p className="text-gray-600 text-sm">
                    {selectedClass 
                      ? `Common actions for ${selectedClass.course_code}`
                      : "Common actions across your classes"
                    }
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Button onClick={navigateToAddCase} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    New Case
                  </Button>
                  <Button variant="outline" onClick={navigateToStudents} className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                  <Button variant="outline" onClick={navigateToAnalytics} className="w-full sm:w-auto">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">
                    {studentCount} students • {caseCount} practice cases • {getTotalSessionsCompleted()} total sessions
                  </span>
                  {selectedClass && (
                    <Badge variant="outline" className="text-xs">
                      {selectedClass.section_code} • {selectedClass.term?.name}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
            {/* Student Activity */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="h-full">
              <Card className="shadow-lg border-0 bg-white h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-slate-600" />
                      <CardTitle className="text-slate-800">Recent Student Activity</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-slate-600 hover:text-slate-800"
                      onClick={navigateToStudents}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-slate-600">
                    {selectedClass ? 'Students in this class' : 'Students with recent engagement'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="p-4 text-left font-semibold">Student</TableHead>
                        <TableHead className="p-4 text-center font-semibold">Sessions</TableHead>
                        <TableHead className="p-4 text-center font-semibold">Last Active</TableHead>
                        <TableHead className="p-4 text-center font-semibold w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(studentEngagement) && studentEngagement.length > 0 ? (
                        studentEngagement
                          .slice(0, 5)
                          .map((student, index) => (
                            <motion.tr
                              key={student.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <TableCell className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-100 p-2 rounded-full">
                                    <Users className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{formatDisplayName(student.name)}</div>
                                    {student.email && (
                                      <div className="text-sm text-gray-500">{student.email}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="p-4 text-center">
                                <Badge 
                                  variant="secondary" 
                                  className={`${student.sessionsCompleted > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                >
                                  {student.sessionsCompleted}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-4 text-center text-sm text-gray-600">
                                {student.lastActive}
                              </TableCell>
                              <TableCell className="p-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {student.email && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(`mailto:${student.email}`)}
                                      title="Send email"
                                      className="h-8 w-8"
                                    >
                                      <Mail size={14} className="text-blue-500" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="p-8 text-center text-gray-500">
                            <div className="space-y-2">
                              <Users className="h-12 w-12 mx-auto text-gray-300" />
                              <div className="text-lg font-medium">
                                {selectedClass ? 'No students in this class' : 'No student data available'}
                              </div>
                              <div className="text-sm">
                                <Button
                                  variant="link"
                                  onClick={navigateToStudents}
                                  className="p-0"
                                >
                                  Add students to get started
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Practice Cases */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="h-full">
              <Card className="shadow-lg border-0 bg-white h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-emerald-800">Top Practice Cases</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-emerald-600 hover:text-emerald-800"
                      onClick={navigateToAnalytics}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-emerald-600">
                    {selectedClass ? 'Most used cases in this class' : 'Most popular practice cases'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-50/50">
                        <TableHead className="p-4 text-left font-semibold">Practice Case</TableHead>
                        <TableHead className="p-4 text-center font-semibold">Students</TableHead>
                        <TableHead className="p-4 text-center font-semibold">Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(analyticsData) && analyticsData.length > 0 ? (
                        analyticsData.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-emerald-50/50 transition-colors"
                          >
                            <TableCell className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                  <BookOpen className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="font-medium">{item.title}</div>
                              </div>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {item.studentsUsed}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              <Badge 
                                variant="secondary" 
                                className={`${
                                  item.completionRate >= 80 
                                    ? 'bg-green-100 text-green-800' 
                                    : item.completionRate >= 60 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.completionRate}%
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="p-8 text-center text-gray-500">
                            <div className="space-y-2">
                              <BarChart3 className="h-12 w-12 mx-auto text-gray-300" />
                              <div className="text-lg font-medium">
                                {selectedClass ? 'No analytics data for this class' : 'No analytics data available'}
                              </div>
                              <div className="text-sm">
                                Data will appear once students start using practice cases
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Practice Cases */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-indigo-800">Recent Practice Cases</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-800"
                    onClick={navigateToLessons}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-indigo-600">
                  {selectedClass ? 'Practice cases for this class' : 'Recently added practice cases'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.isArray(recentPracticeCases) && recentPracticeCases.length > 0 ? (
                    recentPracticeCases.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex"
                      >
                        <Card className="border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 group w-full">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              <div className="bg-indigo-100 p-2 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <BookOpen className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                  {item.title}
                                </h3>
                              </div>
                            </div>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                              {item.description}
                            </p>
                            <Button 
                              variant="link" 
                              className="p-0 text-indigo-600 hover:text-indigo-700 flex items-center text-sm font-medium"
                              onClick={() => navigate(`/instructor/review/${item.id}`)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Case
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No practice cases yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {selectedClass ? 'No practice cases for this class' : 'No practice cases available'}. 
                        Create your first practice case to get started.
                      </p>
                      <Button onClick={navigateToAddCase} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Case
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </ClassAwareLayout>
  );
};

export default InstructorDashboard;