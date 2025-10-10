import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  BarChart3,
  Clock,
  Users,
  Target,
  BookOpen,
  Activity,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft
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

interface StudentDetail {
  id: number;
  name: string | null;
  email: string;
  completed: boolean;
  timeSpent: number; // in seconds
  messageCount: number;
  attempts: number;
  completedAttempts: number;
  lastAttempt: string | null;
  attemptHistory: AttemptSummary[];
}

interface AttemptSummary {
  id: number;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  completed: boolean;
  messageCount: number;
}

interface AttemptSummaryResponse {
  id: number;
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
  completed?: boolean;
  messageCount?: number;
}

interface StudentDetailResponse {
  id: number;
  name: string | null;
  email: string | null;
  completed?: boolean;
  timeSpent?: number;
  messageCount?: number;
  attempts?: number;
  completedAttempts?: number;
  lastAttempt?: string | null;
  attemptHistory?: AttemptSummaryResponse[];
}

interface CaseDetails {
  caseId: number;
  caseTitle: string;
  students: StudentDetail[];
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

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return "Unknown";

  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

const Analytics: React.FC = () => {
  const { selectedClass, apiParams } = useClass();
  const [analytics, setAnalytics] = useState<CaseAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("usage");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const CASE_DISPLAY_INCREMENT = 20;
  const [caseDisplayCount, setCaseDisplayCount] = useState(CASE_DISPLAY_INCREMENT);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const studentPickerRef = useRef<HTMLDivElement | null>(null);
  const detailsSectionRef = useRef<HTMLDivElement | null>(null);
  const [caseDetails, setCaseDetails] = useState<Map<number, CaseDetails>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());

  const fetchAnalytics = useCallback(async () => {
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
  }, [apiParams]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    setCaseDisplayCount(CASE_DISPLAY_INCREMENT);
  }, [caseSearchTerm, sortBy, showOnlyActive]);

  useEffect(() => {
    if (!isStudentPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (studentPickerRef.current && !studentPickerRef.current.contains(event.target as Node)) {
        setIsStudentPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStudentPickerOpen]);

  const fetchCaseDetails = async (caseId: number) => {
    // If already loading or already have details, skip
    if (loadingDetails.has(caseId) || caseDetails.has(caseId)) {
      return;
    }

    setLoadingDetails(prev => new Set(prev).add(caseId));

    try {
      const queryString = apiParams.toString();
      const url = `/api/instructors/analytics/${caseId}/details${queryString ? `?${queryString}` : ''}`;

      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch case details");

      const data = await response.json();
      const studentsFromApi: StudentDetailResponse[] = Array.isArray(data.students) ? data.students : [];
      const normalizedStudents: StudentDetail[] = studentsFromApi.map((student) => {
        const attemptHistory: AttemptSummary[] = Array.isArray(student.attemptHistory)
          ? student.attemptHistory.map((attempt: AttemptSummaryResponse) => ({
            id: attempt.id,
            startTime: attempt.startTime || null,
            endTime: attempt.endTime || null,
            duration: attempt.duration || 0,
            completed: Boolean(attempt.completed),
            messageCount: attempt.messageCount || 0
          }))
          : [];
        const completedAttempts =
          typeof student.completedAttempts === "number"
            ? student.completedAttempts
            : attemptHistory.filter((attempt: AttemptSummary) => attempt.completed).length;

        return {
          ...student,
          name: student.name ?? null,
          email: student.email || "",
          completed: typeof student.completed === "boolean" ? student.completed : completedAttempts > 0,
          completedAttempts,
          attemptHistory,
          timeSpent: student.timeSpent || 0,
          messageCount: student.messageCount || 0,
          attempts: student.attempts || attemptHistory.length,
        };
      });

      setCaseDetails(prev =>
        new Map(prev).set(caseId, {
          caseId: data.caseId,
          caseTitle: data.caseTitle,
          students: normalizedStudents
        })
      );
    } catch (error) {
      console.error("Error fetching case details:", error);
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(caseId);
        return newSet;
      });
    }
  };

  const handleCaseSelection = async (caseId: number) => {
    setSelectedCaseId(caseId);
    setSelectedStudentId(null);
    setStudentSearchTerm("");
    setIsStudentPickerOpen(false);

    if (!caseDetails.has(caseId)) {
      await fetchCaseDetails(caseId);
    }
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setSelectedStudentId(null);
    setStudentSearchTerm("");
    setIsStudentPickerOpen(false);
  };

  const handleShowMoreCases = () => {
    setCaseDisplayCount(prev => prev + CASE_DISPLAY_INCREMENT);
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

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (rate > 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-400 bg-gray-50 border-gray-200";
  };

  const stats = getTotalStats();
  const sortedAnalytics = getSortedAnalytics();
  const filteredCases = useMemo(() => {
    if (!caseSearchTerm.trim()) {
      return sortedAnalytics;
    }

    const term = caseSearchTerm.toLowerCase();
    return sortedAnalytics.filter(item => item.title.toLowerCase().includes(term));
  }, [sortedAnalytics, caseSearchTerm]);
  const hasMoreCases = filteredCases.length > caseDisplayCount;
  const visibleCases = filteredCases.slice(0, caseDisplayCount);
  const hasCaseFilters = caseSearchTerm.trim().length > 0 || showOnlyActive;

  useEffect(() => {
    const nextCount = Math.max(CASE_DISPLAY_INCREMENT, filteredCases.length);
    if (caseDisplayCount > nextCount) {
      setCaseDisplayCount(nextCount);
    }
  }, [filteredCases.length, caseDisplayCount]);
  const selectedCaseDetails = selectedCaseId ? caseDetails.get(selectedCaseId) : undefined;
  const studentsForSelectedCase = useMemo(
    () => selectedCaseDetails?.students ?? [],
    [selectedCaseDetails]
  );
  const isSelectedCaseLoading = selectedCaseId ? loadingDetails.has(selectedCaseId) : false;

  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) {
      return studentsForSelectedCase;
    }

    const term = studentSearchTerm.toLowerCase();
    return studentsForSelectedCase.filter(student => {
      const nameMatch = student.name?.toLowerCase().includes(term);
      const emailMatch = student.email?.toLowerCase().includes(term);
      return nameMatch || emailMatch;
    });
  }, [studentsForSelectedCase, studentSearchTerm]);

  const selectedStudent = selectedStudentId
    ? studentsForSelectedCase.find(student => student.id === selectedStudentId)
    : undefined;

  const selectedCaseTitle =
    (selectedCaseDetails && selectedCaseDetails.caseTitle) ||
    (selectedCaseId ? analytics.find(item => item.id === selectedCaseId)?.title : undefined) ||
    "Practice Case";
  const selectedCaseAnalyticsSummary = selectedCaseId
    ? analytics.find(item => item.id === selectedCaseId)
    : undefined;

  useEffect(() => {
    if (!selectedCaseId) return;
    if (!detailsSectionRef.current) return;

    detailsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedCaseId]);

  return (
    <ClassAwareLayout
      title="Analytics"
      description={getPageDescription()}
    >
      {/* Enhanced Stats Overview */}
      {stats && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 space-y-4"
        >
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total Cases
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">{stats.totalCases}</p>
                    <p className="text-xs text-muted-foreground">{stats.activeCases} active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Student Uses
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">{stats.totalStudentUsage}</p>
                    <p className="text-xs text-muted-foreground">Across all cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Avg Completion
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">{stats.averageCompletionRate}%</p>
                    <p className="text-xs text-muted-foreground">Across all cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Avg Session Time
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">{formatTime(stats.averageTimeSpent)}</p>
                    <p className="text-xs text-muted-foreground">Per completed attempt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      )}

      {/* Controls and Filters */}
      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
            <div className="relative md:w-64 lg:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={caseSearchTerm}
                onChange={(event) => setCaseSearchTerm(event.target.value)}
                placeholder="Search practice cases..."
                className="pl-9"
              />
            </div>
          </div>

        </div>

        {/* Results Summary */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {visibleCases.length} of {filteredCases.length} {hasCaseFilters ? "matching" : ""} practice cases
              {analytics.length !== filteredCases.length ? ` (out of ${analytics.length} total)` : ""}
            </span>
            {selectedClass && (
              <Badge variant="outline" className="text-xs">
                {selectedClass.section_code} • {selectedClass.term?.name}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {selectedCaseId ? (
        <motion.div
          key={selectedCaseId}
          ref={detailsSectionRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
          className="mt-6"
        >
          <Card className="shadow-lg border border-slate-100 bg-white">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBackToCases}
                  className="w-max border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to cases
                </Button>
                {selectedCaseAnalyticsSummary && (
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      {selectedCaseAnalyticsSummary.studentsUsed} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-purple-500" />
                      {selectedCaseAnalyticsSummary.completionRate}% completion
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      {selectedCaseAnalyticsSummary.avgTimeSpent > 0
                        ? formatTime(selectedCaseAnalyticsSummary.avgTimeSpent)
                        : "No avg time"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">{selectedCaseTitle}</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Choose a student to explore their practice history for this case.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isSelectedCaseLoading || !selectedCaseDetails ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span>Loading student data...</span>
                </div>
              ) : studentsForSelectedCase.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 py-12 text-center text-slate-500">
                  No student activity recorded for this practice case yet.
                </div>
              ) : (
                <div className="space-y-6">
                  <div ref={studentPickerRef} className="relative w-full sm:w-80">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setIsStudentPickerOpen(prev => !prev)}
                    >
                      <span>
                        {selectedStudent ? selectedStudent.name || selectedStudent.email : "Select a student"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </Button>

                    {isStudentPickerOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-xl">
                        <div className="p-3 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              autoFocus
                              value={studentSearchTerm}
                              onChange={(event) => setStudentSearchTerm(event.target.value)}
                              placeholder="Search by name or email..."
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => {
                              const isActive = selectedStudentId === student.id;
                              return (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setIsStudentPickerOpen(false);
                                  }}
                                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                    isActive ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-slate-900">
                                      {student.name || "Unregistered Student"}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        student.completed
                                          ? "border-green-200 bg-green-50 text-green-700"
                                          : "border-amber-200 bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {student.completed ? "Completed" : "Incomplete"}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500 truncate">{student.email}</div>
                                  <div className="mt-1 text-[11px] text-slate-400">
                                    {student.attempts} {student.attempts === 1 ? "attempt" : "attempts"}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-sm text-slate-500 text-center">
                              No students match &ldquo;{studentSearchTerm.trim()}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedStudent ? (
                    <div className="space-y-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-slate-900">
                            {selectedStudent.name || selectedStudent.email}
                          </div>
                          <div className="text-sm text-slate-500">{selectedStudent.email}</div>
                        </div>
                        <Badge
                          className={`flex items-center gap-1 px-3 py-1 text-sm ${
                            selectedStudent.completed
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {selectedStudent.completed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Completed
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Incomplete
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Total Attempts
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-slate-900">
                            {selectedStudent.attempts}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Completed Attempts
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-slate-900">
                            {selectedStudent.completedAttempts}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Total Time Spent
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-slate-900">
                            {selectedStudent.timeSpent > 0 ? formatTime(selectedStudent.timeSpent) : "—"}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Messages Sent
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-slate-900">
                            {selectedStudent.messageCount}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Last Attempt
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          {selectedStudent.lastAttempt ? formatDateTime(selectedStudent.lastAttempt) : "No attempts yet"}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900">Attempt History</h4>
                          <p className="text-sm text-slate-500">
                            Each attempt shows duration, message count, and completion status.
                          </p>
                        </div>
                        {selectedStudent.attemptHistory.length > 0 ? (
                          selectedStudent.attemptHistory.map((attempt, index) => {
                            const attemptNumber = selectedStudent.attemptHistory.length - index;
                            return (
                              <div
                                key={attempt.id}
                                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      Attempt {attemptNumber}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Started {formatDateTime(attempt.startTime)}
                                    </div>
                                    {attempt.endTime && (
                                      <div className="text-xs text-slate-400">
                                        Ended {formatDateTime(attempt.endTime)}
                                      </div>
                                    )}
                                  </div>
                                  <Badge
                                    className={`flex items-center gap-1 px-3 py-1 text-sm ${
                                      attempt.completed
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {attempt.completed ? "Completed" : "Incomplete"}
                                  </Badge>
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span>
                                      {attempt.duration > 0 ? formatTime(attempt.duration) : "No duration recorded"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-slate-400" />
                                    <span>{attempt.messageCount} messages</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-slate-400" />
                                    <span>Conversation ID {attempt.id}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 py-10 text-center text-slate-500">
                            No attempts have been recorded for this student.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 py-12 text-center text-slate-500">
                      Select a student to view their attempt history for this practice case.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
        >
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="p-4 text-left font-semibold w-12">Select</TableHead>
                    <TableHead className="p-4 text-left font-semibold">Practice Case</TableHead>
                    <TableHead className="p-4 text-center font-semibold">Students</TableHead>
                    <TableHead className="p-4 text-center font-semibold">Avg Time</TableHead>
                    <TableHead className="p-4 text-center font-semibold">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-8 text-center text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Loading analytics data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : visibleCases.length > 0 ? (
                    visibleCases.map((entry, index) => {
                      const isMostPopular = sortBy === "usage" && sortedAnalytics[0]?.id === entry.id && entry.studentsUsed > 0;

                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.04 }}
                          className="transition-colors cursor-pointer hover:bg-slate-50/50"
                          onClick={() => handleCaseSelection(entry.id)}
                        >
                          <TableCell className="p-4">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{entry.title}</div>
                                {isMostPopular && (
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
                              className={`${entry.studentsUsed > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                            >
                              {entry.studentsUsed}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4 text-center text-sm">
                            {entry.avgTimeSpent > 0 ? (
                              formatTime(entry.avgTimeSpent)
                            ) : (
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
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="p-8 text-center text-gray-500">
                        <div className="space-y-2">
                          <BarChart3 className="h-12 w-12 mx-auto text-gray-300" />
                          <div className="text-lg font-medium">
                            {analytics.length === 0
                              ? "No analytics data available"
                              : hasCaseFilters
                                ? "No practice cases match your filters"
                                : "No practice cases to display"}
                          </div>
                          <div className="text-sm">
                            {analytics.length === 0
                              ? getEmptyStateMessage()
                              : hasCaseFilters
                                ? "Try adjusting the active filter or updating your search term."
                                : "Once you publish practice cases and students begin working, analytics will appear here."}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {hasMoreCases && (
                <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing {visibleCases.length} of {filteredCases.length} matching cases
                  </span>
                  <Button variant="outline" size="sm" onClick={handleShowMoreCases}>
                    Show more cases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Additional Context Information */}
      {selectedClass && analytics.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.18 }}
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
