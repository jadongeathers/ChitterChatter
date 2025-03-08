import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen, BarChart, Clock, UserPlus, ArrowRight } from "lucide-react";

interface Student {
  id: number;
  name: string;
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
  const [studentEngagement, setStudentEngagement] = useState<Student[]>([]);
  const [recentPracticeCases, setRecentPracticeCases] = useState<PracticeCase[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          engagementRes, 
          practiceRes, 
          analyticsRes
        ] = await Promise.all([
          fetchWithAuth("/api/instructors/students/engagement"),
          fetchWithAuth("/api/practice_cases/get_cases"),
          fetchWithAuth("/api/instructors/analytics")
        ]);

        const engagementData = await engagementRes.json();
        const practiceData = await practiceRes.json();
        const analyticsData = await analyticsRes.json();

        // Set student engagement data
        setStudentEngagement(engagementData);
        setStudentCount(engagementData.length);
        
        // Count active students (those who have completed at least one session)
        const activeCount = engagementData.filter(
          (student: Student) => student.sessionsCompleted > 0
        ).length;
        setActiveStudents(activeCount);
        
        // Set practice cases data (limited to most recent 3)
        setRecentPracticeCases(practiceData.slice(0, 3));
        setCaseCount(practiceData.length);
        
        // Set analytics data (sorted by usage, limited to top 3)
        const sortedAnalytics = analyticsData.sort(
          (a: any, b: any) => b.studentsUsed - a.studentsUsed
        ).slice(0, 3);
        setAnalyticsData(sortedAnalytics);
        
      } catch (error) {
        console.error("Failed to fetch instructor dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const navigateToStudents = () => navigate("/instructor/students");
  const navigateToLessons = () => navigate("/instructor/lessons");
  const navigateToAnalytics = () => navigate("/instructor/analytics");
  const navigateToAddCase = () => navigate("/instructor/review/new");
  const navigateToAddStudent = () => {
    // This assumes you have a way to open the "Add Student" dialog from the Students page
    navigate("/instructor/students");
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage lessons, monitor student engagement, and review performance trends</p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Students</CardTitle>
              <Users className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studentCount}</div>
              <p className="text-sm text-gray-500">
                {activeStudents} active ({studentCount > 0 
                  ? Math.round((activeStudents / studentCount) * 100) 
                  : 0}%)
              </p>
              <Button 
                variant="link" 
                className="p-0 mt-2 text-primary flex items-center" 
                onClick={navigateToStudents}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Practice Cases</CardTitle>
              <BookOpen className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{caseCount}</div>
              <p className="text-sm text-gray-500">Total practice lessons</p>
              <Button 
                variant="link" 
                className="p-0 mt-2 text-primary flex items-center" 
                onClick={navigateToLessons}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <Clock className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={navigateToAddCase}
              >
                <BookOpen className="h-4 w-4 mr-2" /> Add Practice Case
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={navigateToAddStudent}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top Students */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Student Activity</CardTitle>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary/80"
                onClick={navigateToStudents}
              >
                View All
              </Button>
            </div>
            <CardDescription>
              Students with recent engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentEngagement.length > 0 ? (
                  studentEngagement
                    .slice(0, 5)
                    .map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-right">{student.sessionsCompleted}</TableCell>
                        <TableCell className="text-right">{student.lastActive}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No student data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Cases */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Top Practice Cases</CardTitle>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary/80"
                onClick={navigateToAnalytics}
              >
                View Analytics
              </Button>
            </div>
            <CardDescription>
              Most used practice cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Practice Case</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.length > 0 ? (
                  analyticsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-right">{item.studentsUsed}</TableCell>
                      <TableCell className="text-right">{item.completionRate}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No analytics data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Practice Cases */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Practice Cases</CardTitle>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary/80"
                onClick={navigateToLessons}
              >
                View All
              </Button>
            </div>
            <CardDescription>
              Recently added practice cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentPracticeCases.length > 0 ? (
                recentPracticeCases.map((item) => (
                  <Card key={item.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                        {item.description}
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 mt-2 text-primary"
                        onClick={() => navigate(`/instructor/review/${item.id}`)}
                      >
                        Edit Case
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  No practice cases available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InstructorDashboard;