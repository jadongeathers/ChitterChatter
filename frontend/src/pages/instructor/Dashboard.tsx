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
  lastLoginTimestamp?: string; // Optional for future use
}

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  studentsUsed?: number;
  completionRate?: number;
  published?: boolean;
}

const InstructorDashboard: React.FC = () => {
  const { selectedClass, apiParams } = useClass();
  const [studentEngagement, setStudentEngagement] = useState<Student[]>([]);
  const [recentPracticeCases, setRecentPracticeCases] = useState<PracticeCase[]>([]);
  const [allPracticeCases, setAllPracticeCases] = useState<PracticeCase[]>([]);
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
      
      setAllPracticeCases(practiceData);
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

  const getTotalSessionsCompleted = () => {
    if (!Array.isArray(studentEngagement)) return 0;
    return studentEngagement.reduce((sum, student) => sum + student.sessionsCompleted, 0);
  };

  const getRecentActivityCount = () => {
    if (!Array.isArray(studentEngagement)) return 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return studentEngagement.filter(student => {
      if (!student.lastLoginTimestamp) return false;
      
      const lastLogin = new Date(student.lastLoginTimestamp);
      return lastLogin >= sevenDaysAgo;
    }).length;
  };

  const getPublishedCasesCount = () => {
    if (!Array.isArray(allPracticeCases)) return 0;
    
    // Count cases that have the published property set to true
    return allPracticeCases.filter(practiceCase => practiceCase.published === true).length;
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
          {/* Quick Actions Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      {selectedClass 
                        ? `Common actions for ${selectedClass.course_code}`
                        : "Common actions across your classes"
                      }
                    </CardDescription>
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
              </CardHeader>
            </Card>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Class Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{studentCount}</p>
                      <p className="text-xs text-muted-foreground">{getRecentActivityCount()} active this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                      <p className="text-2xl font-bold">{getTotalSessionsCompleted()}</p>
                      <p className="text-xs text-muted-foreground">Across all students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Published Cases</p>
                      <p className="text-2xl font-bold">{getPublishedCasesCount()}</p>
                      <p className="text-xs text-muted-foreground">{caseCount} total cases</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                      <p className="text-2xl font-bold">{getEngagementRate()}%</p>
                      <p className="text-xs text-muted-foreground">{activeStudents} of {studentCount} active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="space-y-8">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Activity */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-slate-600 mr-3" />
                        <div>
                          <CardTitle className="text-slate-800">Recent Student Activity</CardTitle>
                          <CardDescription className="text-slate-600">
                            {selectedClass ? 'Students in this class' : 'Students with recent engagement'}
                          </CardDescription>
                        </div>
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
                  </CardHeader>
                  <CardContent className="p-0">
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
                            <TableCell colSpan={4} className="text-center py-12">
                              <div className="space-y-3">
                                <Users className="h-12 w-12 mx-auto text-gray-300" />
                                <div className="text-lg font-medium text-gray-500">
                                  {selectedClass ? 'No students in this class' : 'No student data available'}
                                </div>
                                <Button variant="link" onClick={navigateToStudents}>
                                  Add students to get started
                                </Button>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600 mr-3" />
                        <div>
                          <CardTitle className="text-emerald-800">Top Practice Cases</CardTitle>
                          <CardDescription className="text-emerald-600">
                            {selectedClass ? 'Most used cases in this class' : 'Most popular practice cases'}
                          </CardDescription>
                        </div>
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
                  </CardHeader>
                  <CardContent className="p-0">
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
                            <TableRow key={item.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div className="font-medium">{item.title}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">
                                  {item.studentsUsed}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={
                                    item.completionRate >= 80 
                                      ? 'default' 
                                      : item.completionRate >= 60 
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                >
                                  {item.completionRate}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-12">
                              <div className="space-y-3">
                                <BarChart3 className="h-12 w-12 mx-auto text-gray-300" />
                                <div className="text-lg font-medium text-gray-500">
                                  {selectedClass ? 'No analytics data for this class' : 'No analytics data available'}
                                </div>
                                <div className="text-sm text-gray-400">
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
              transition={{ delay: 0.5 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                      <div>
                        <CardTitle>Recent Practice Cases</CardTitle>
                        <CardDescription>
                          {selectedClass ? 'Practice cases for this class' : 'Recently added practice cases'}
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={navigateToLessons}
                    >
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.isArray(recentPracticeCases) && recentPracticeCases.length > 0 ? (
                      recentPracticeCases.map((item, index) => (
                        <Card key={item.id} className="border hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 truncate">
                                  {item.title}
                                </h3>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                              {item.description}
                            </p>
                            <Button 
                              variant="link" 
                              className="p-0 text-purple-600 hover:text-purple-700 flex items-center text-sm"
                              onClick={() => navigate(`/instructor/review/${item.id}`)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Case
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No practice cases yet</h3>
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
          </div>
        </>
      )}
    </ClassAwareLayout>
  );
};

export default InstructorDashboard;