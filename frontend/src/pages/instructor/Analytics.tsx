import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  AlertTriangle,
  Download,
  RefreshCcw,
  BookOpen,
  Activity
} from "lucide-react";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";

interface CaseAnalytics {
  id: number;
  title: string;
  studentsUsed: number;
  avgTimeSpent: number; // in seconds
  completionRate: number; // percentage
}

// Convert seconds to "X min Y sec" format
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return remainingSeconds > 0 
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
};

const Analytics: React.FC = () => {
  const { selectedClass, apiParams, classDisplayName } = useClass();
  const [analytics, setAnalytics] = useState<CaseAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("usage");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedClass]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const queryString = apiParams.toString();
      const url = `/api/instructors/analytics${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort and filter analytics data
  const getSortedAnalytics = () => {
    let filtered = [...analytics];
    
    // Filter out inactive cases if requested
    if (showOnlyActive) {
      filtered = filtered.filter(item => item.studentsUsed > 0);
    }
    
    // Sort based on selection
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.studentsUsed - a.studentsUsed;
        case "completion":
          return b.completionRate - a.completionRate;
        case "time":
          return b.avgTimeSpent - a.avgTimeSpent;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return b.studentsUsed - a.studentsUsed;
      }
    });
    
    return filtered;
  };

  const getPageDescription = () => {
    if (selectedClass) {
      return `Track student usage and engagement with practice cases in ${selectedClass.course_code}`;
    }
    return "Track student usage and engagement with practice cases across all your classes";
  };

  const getEmptyStateMessage = () => {
    if (selectedClass) {
      return `No analytics data available for ${selectedClass.course_code}. Data will appear once students start using practice cases.`;
    }
    return "No analytics data available. Data will appear once students start using practice cases.";
  };

  const getTotalStats = () => {
    if (analytics.length === 0) return null;
    
    const totalCases = analytics.length;
    const activeCases = analytics.filter(item => item.studentsUsed > 0).length;
    const totalStudentUsage = analytics.reduce((sum, item) => sum + item.studentsUsed, 0);
    const averageCompletionRate = analytics.length > 0 
      ? analytics.reduce((sum, item) => sum + item.completionRate, 0) / totalCases 
      : 0;
    const averageTimeSpent = analytics.length > 0 
      ? analytics.reduce((sum, item) => sum + item.avgTimeSpent, 0) / totalCases 
      : 0;
    
    return {
      totalCases,
      activeCases,
      totalStudentUsage,
      averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
      averageTimeSpent
    };
  };

  const getMostUsedCases = () => {
    return analytics
      .filter(item => item.studentsUsed > 0)
      .sort((a, b) => b.studentsUsed - a.studentsUsed)
      .slice(0, 3);
  };

  const getLowEngagementCases = () => {
    return analytics
      .filter(item => item.studentsUsed >= 3 && item.completionRate < 40)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3);
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (rate > 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-400 bg-gray-50 border-gray-200";
  };

  const stats = getTotalStats();
  const sortedAnalytics = getSortedAnalytics();
  const mostUsedCases = getMostUsedCases();
  const lowEngagementCases = getLowEngagementCases();

  return (
    <ClassAwareLayout
      title="Analytics"
      description={getPageDescription()}
    >
      {/* Enhanced Stats Overview */}
      {stats && (
        <div className="mb-8 space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{stats.totalCases}</div>
                    <div className="text-sm text-blue-700">Total Cases</div>
                    <div className="text-xs text-blue-600">{stats.activeCases} active</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">{stats.totalStudentUsage}</div>
                    <div className="text-sm text-green-700">Student Uses</div>
                    <div className="text-xs text-green-600">All cases combined</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-900">{stats.averageCompletionRate}%</div>
                    <div className="text-sm text-purple-700">Avg Completion</div>
                    <div className="text-xs text-purple-600">Across all cases</div>
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
                    <div className="text-2xl font-bold text-orange-900">{formatTime(stats.averageTimeSpent)}</div>
                    <div className="text-sm text-orange-700">Avg Time</div>
                    <div className="text-xs text-orange-600">Per session</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Popular Cases */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <TrendingUp className="h-5 w-5" />
                  <span>Most Used Cases</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mostUsedCases.length > 0 ? (
                  mostUsedCases.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm truncate max-w-[200px]">{item.title}</div>
                          <div className="text-xs text-gray-500">{formatTime(item.avgTimeSpent)} avg time</div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 text-sm">
                        {item.studentsUsed} uses
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No student activity yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cases with Low Engagement */}
            {lowEngagementCases.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Low Engagement Cases</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lowEngagementCases.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-amber-600 text-white text-xs px-2 py-1">
                          Review
                        </Badge>
                        <div>
                          <div className="font-medium text-sm truncate max-w-[200px]">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.studentsUsed} students tried</div>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 text-sm">
                        {item.completionRate}% completion
                      </Badge>
                    </div>
                  ))}
                  <div className="text-xs text-amber-700 mt-2">
                    These cases have low completion rates with sufficient student usage
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Controls and Filters */}
      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="completion">Best Completion</SelectItem>
                <SelectItem value="time">Longest Time</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showOnlyActive ? "default" : "outline"}
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Active Only</span>
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAnalytics} className="flex items-center space-x-2">
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">
              Showing {sortedAnalytics.length} of {analytics.length} practice cases
            </span>
            {selectedClass && (
              <Badge variant="outline" className="text-xs">
                {selectedClass.section_code} • {selectedClass.term?.name}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Enhanced Analytics Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="p-4 text-left font-semibold">Practice Case</TableHead>
                  <TableHead className="p-4 text-center font-semibold">Students</TableHead>
                  <TableHead className="p-4 text-center font-semibold">Avg Time</TableHead>
                  <TableHead className="p-4 text-center font-semibold">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Loading analytics data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedAnalytics.length > 0 ? (
                  sortedAnalytics.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{entry.title}</div>
                            {index === 0 && sortBy === "usage" && entry.studentsUsed > 0 && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                                Most Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={`${entry.studentsUsed > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {entry.studentsUsed}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-center text-sm">
                        {entry.avgTimeSpent > 0 ? formatTime(entry.avgTimeSpent) : (
                          <span className="text-gray-400">No data</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        {entry.completionRate > 0 ? (
                          <Badge className={getCompletionRateColor(entry.completionRate)}>
                            {entry.completionRate}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="space-y-2">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-300" />
                        <div className="text-lg font-medium">
                          {showOnlyActive ? "No active cases found" : "No analytics data available"}
                        </div>
                        <div className="text-sm">
                          {showOnlyActive ? (
                            <Button
                              variant="link"
                              onClick={() => setShowOnlyActive(false)}
                              className="p-0"
                            >
                              Show all cases including unused ones
                            </Button>
                          ) : (
                            getEmptyStateMessage()
                          )}
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

      {/* Additional Context Information */}
      {selectedClass && analytics.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">
              Analytics for {selectedClass.course_code} - Section {selectedClass.section_code}
              {selectedClass.term && ` • ${selectedClass.term.name}`}
            </div>
            <div className="text-blue-600">
              Data includes all student interactions with practice cases in this class section. 
              Completion rates are calculated based on students who finished the minimum required time.
            </div>
          </div>
        </motion.div>
      )}
    </ClassAwareLayout>
  );
};

export default Analytics;