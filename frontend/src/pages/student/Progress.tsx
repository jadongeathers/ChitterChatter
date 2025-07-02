// Redesigned Progress.tsx
import React, { useState, useEffect } from "react";
import ConversationHistoryTable from "@/components/student/ConversationHistoryTable";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Target, 
  Clock, 
  TrendingUp,
  Calendar,
  Award,
  Search,
  Filter,
  SortAsc
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentClassAwareLayout from "@/components/student/StudentClassAwareLayout";
import { useStudentClass } from "@/contexts/StudentClassContext";

interface ProgressData {
  total_conversations: number;
  completed_cases: number;
  cases: {
    id: number;
    title: string;
    times_practiced: number;
    avg_time_spent: number;
    completed: boolean;
    conversation_id?: number;
    last_completed?: string;
  }[];
}

// Format seconds into MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const Progress: React.FC = () => {
  const { selectedClass, apiParams } = useStudentClass();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [filteredCases, setFilteredCases] = useState<ProgressData['cases']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchProgress();
  }, [selectedClass]);

  useEffect(() => {
    filterAndSortCases();
  }, [progressData, searchTerm, filterBy, sortBy]);

  const fetchProgress = async () => {
    try {
      const queryString = apiParams.toString();
      const url = `/api/students/progress${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch progress data");

      const data: ProgressData = await response.json();
      setProgressData(data);
    } catch (err) {
      console.error("Error fetching progress data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCases = () => {
    if (!progressData?.cases) return;
    
    let filtered = [...progressData.cases];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy === "completed") {
      filtered = filtered.filter(case_ => case_.completed);
    } else if (filterBy === "incomplete") {
      filtered = filtered.filter(case_ => !case_.completed);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          if (!a.last_completed && !b.last_completed) return 0;
          if (!a.last_completed) return 1;
          if (!b.last_completed) return -1;
          return new Date(b.last_completed).getTime() - new Date(a.last_completed).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "times":
          return b.times_practiced - a.times_practiced;
        case "time":
          return b.avg_time_spent - a.avg_time_spent;
        default:
          return 0;
      }
    });

    setFilteredCases(filtered);
  };

  const getPageDescription = () => {
    if (selectedClass) {
      return `Track your practice history and improvements over time for ${selectedClass.course_code}`;
    }
    return "Track your practice history and improvements over time across all classes";
  };

  const getTotalTimeSpent = () => {
    if (!progressData?.cases) return 0;
    return progressData.cases.reduce((total, case_) => 
      total + (case_.avg_time_spent * case_.times_practiced), 0
    );
  };

  const getTotalPracticeSessions = () => {
    if (!progressData?.cases) return 0;
    return progressData.cases.reduce((total, case_) => total + case_.times_practiced, 0);
  };

  const getCompletionRate = () => {
    if (!progressData?.cases || progressData.cases.length === 0) return 0;
    return Math.round((progressData.completed_cases / progressData.cases.length) * 100);
  };

  const getCaseCountText = () => {
    const totalCount = progressData?.cases.length || 0;
    const filteredCount = filteredCases.length;
    
    if (searchTerm || filterBy !== "all") {
      return `${filteredCount} of ${totalCount} cases`;
    }
    
    if (selectedClass) {
      return `${totalCount} cases in ${selectedClass.course_code}`;
    }
    return `${totalCount} total cases`;
  };

  if (isLoading) {
    return (
      <StudentClassAwareLayout
        title="Progress"
        description={getPageDescription()}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your progress...</span>
        </div>
      </StudentClassAwareLayout>
    );
  }

  return (
    <StudentClassAwareLayout
      title="Progress"
      description={getPageDescription()}
    >
      <div className="space-y-8">
        {/* Enhanced Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">{progressData?.completed_cases || 0}</div>
                    <div className="text-sm text-green-700">Cases Completed</div>
                    <div className="text-xs text-green-600">{getCompletionRate()}% completion rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{progressData?.total_conversations || 0}</div>
                    <div className="text-sm text-blue-700">Conversations</div>
                    <div className="text-xs text-blue-600">Total completed</div>
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
                    <div className="text-2xl font-bold text-purple-900">{getTotalPracticeSessions()}</div>
                    <div className="text-sm text-purple-700">Practice Sessions</div>
                    <div className="text-xs text-purple-600">Total attempts</div>
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
                    <div className="text-2xl font-bold text-orange-900">{formatTime(getTotalTimeSpent())}</div>
                    <div className="text-sm text-orange-700">Time Practiced</div>
                    <div className="text-xs text-orange-600">Total time spent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Conversation History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ConversationHistoryTable />
        </motion.div>

        {/* Case Progress Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Search and Filter Controls */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search practice cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cases</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="incomplete">Not Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                      <SelectItem value="times">Most Practiced</SelectItem>
                      <SelectItem value="time">Longest Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">{getCaseCountText()}</span>
                {selectedClass && (
                  <Badge variant="outline" className="text-xs">
                    {selectedClass.section_code} • {selectedClass.term?.name}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Progress Table */}
          <Card className="shadow-lg border border-gray-200 bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-left font-semibold text-gray-700">Practice Case</th>
                      <th className="p-4 text-center font-semibold text-gray-700">Times Practiced</th>
                      <th className="p-4 text-center font-semibold text-gray-700">Avg. Time</th>
                      <th className="p-4 text-center font-semibold text-gray-700">Last Completed</th>
                      <th className="p-4 text-center font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          <div className="space-y-2">
                            <TrendingUp className="h-12 w-12 mx-auto text-gray-300" />
                            <div className="text-lg font-medium">
                              {searchTerm || filterBy !== "all" ? "No cases match your filters" : "No practice data yet"}
                            </div>
                            <div className="text-sm">
                              {searchTerm || filterBy !== "all" ? (
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setSearchTerm("");
                                    setFilterBy("all");
                                  }}
                                  className="p-0"
                                >
                                  Clear filters to see all cases
                                </Button>
                              ) : (
                                selectedClass 
                                  ? `No practice cases found for ${selectedClass.course_code}.`
                                  : 'Start practicing to see your progress here!'
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((caseData, index) => (
                        <motion.tr
                          key={caseData.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            caseData.completed ? "cursor-pointer" : ""
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            if (caseData.completed && caseData.conversation_id) {
                              navigate(`/feedback/${caseData.conversation_id}`);
                            }
                          }}
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{caseData.title}</div>
                            {caseData.completed && caseData.conversation_id && (
                              <div className="text-xs text-blue-600 mt-1">Click to view feedback</div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {caseData.times_practiced}
                            </Badge>
                          </td>
                          <td className="p-4 text-center text-gray-600">
                            {formatTime(caseData.avg_time_spent)}
                          </td>
                          <td className="p-4 text-center text-gray-600">
                            {caseData.last_completed
                              ? new Date(caseData.last_completed).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="p-4 text-center">
                            {caseData.completed ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="text-green-500 h-5 w-5" />
                                <span className="ml-1 text-green-700 text-sm font-medium">Completed</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <XCircle className="text-gray-400 h-5 w-5" />
                                <span className="ml-1 text-gray-500 text-sm">Not Started</span>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </StudentClassAwareLayout>
  );
};

export default Progress;