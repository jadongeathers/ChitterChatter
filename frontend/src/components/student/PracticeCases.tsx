// Redesigned PracticeCases.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Filter, SortAsc, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PracticeCaseCard from "./PracticeCaseCard";
import { fetchWithAuth } from "@/utils/api";
import { useStudentClass } from "@/contexts/StudentClassContext";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  completed?: boolean;
  accessible?: boolean;
  accessible_on?: string;
}

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15
    }
  }
};

const PracticeCases: React.FC = () => {
  const navigate = useNavigate();
  const { selectedClass, apiParams } = useStudentClass();
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<PracticeCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  // Fetch practice cases from API
  const fetchPracticeCases = async () => {
    try {
      setIsLoading(true);
      
      const queryString = apiParams.toString();
      const url = `/api/practice_cases/get_cases${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch practice cases");
      
      const data: PracticeCase[] = await response.json();
      setPracticeCases(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching practice cases:", err);
      setError("Failed to load practice cases.");
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  // Filter and sort cases based on current filters
  const filterAndSortCases = () => {
    let filtered = [...practiceCases];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (case_) =>
          case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy === "completed") {
      filtered = filtered.filter((case_) => case_.completed);
    } else if (filterBy === "incomplete") {
      filtered = filtered.filter((case_) => !case_.completed);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          if (!a.accessible_on || !b.accessible_on) return 0;
          return new Date(b.accessible_on).getTime() - new Date(a.accessible_on).getTime();
        case "oldest":
          if (!a.accessible_on || !b.accessible_on) return 0;
          return new Date(a.accessible_on).getTime() - new Date(b.accessible_on).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredCases(filtered);
  };

  // Helper functions
  const getCompletedCount = () => {
    return practiceCases.filter(case_ => case_.completed).length;
  };

  const getIncompleteCount = () => {
    return practiceCases.filter(case_ => !case_.completed).length;
  };

  const getCaseCountText = () => {
    const totalCount = practiceCases.length;
    const filteredCount = filteredCases.length;
    const caseText = totalCount === 1 ? "case" : "cases";
    
    if (searchTerm || filterBy !== "all") {
      return `${filteredCount} of ${totalCount} practice ${caseText}`;
    }
    
    if (selectedClass) {
      return `${totalCount} practice ${caseText} in ${selectedClass.course_code}`;
    }
    return `${totalCount} practice ${caseText} across all classes`;
  };

  const getEmptyStateMessage = () => {
    if (searchTerm || filterBy !== "all") {
      return "No practice cases match your current filters. Try adjusting your search or filter options.";
    }
    if (selectedClass) {
      return `No practice cases found for ${selectedClass.course_code}. Your instructor hasn't published any cases yet.`;
    }
    return "No practice cases found. Your instructor hasn't published any cases yet.";
  };

  // Effects
  useEffect(() => {
    fetchPracticeCases();
  }, [selectedClass]);

  useEffect(() => {
    filterAndSortCases();
  }, [practiceCases, searchTerm, sortBy, filterBy]);

  if (error) {
    return (
      <div className="text-center text-red-600 text-lg font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats and Controls */}
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-slate-900">{getCompletedCount()}</div>
                  <div className="text-sm text-slate-500">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-slate-900">{getIncompleteCount()}</div>
                  <div className="text-sm text-slate-500">Not Yet Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-slate-900">{practiceCases.length}</div>
                  <div className="text-sm text-slate-500">Total Cases</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 w-full flex-col gap-4 sm:flex-row lg:w-auto">
              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
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
                    <SelectItem value="incomplete">Not Yet Complete</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">{getCaseCountText()}</span>
              {selectedClass && (
                <Badge variant="outline" className="border-slate-200 text-xs text-slate-600">
                  {selectedClass.section_code} • {selectedClass.term?.name}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading practice cases...</span>
        </div>
      ) : (
        /* Practice Cases Grid */
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredCases.map((practiceCase, index) => (
              <motion.div 
                key={practiceCase.id}
                variants={itemVariants}
                custom={index}
                layoutId={`case-${practiceCase.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PracticeCaseCard
                  practiceCase={practiceCase}
                  onStart={(id) => navigate(`/practice/${id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Enhanced Empty State */}
      {!isLoading && filteredCases.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 p-4">
            <BookOpen className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-700">
            {searchTerm || filterBy !== "all" ? "No matches found" : "No practice cases yet"}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-slate-500">
            {getEmptyStateMessage()}
          </p>
          {(searchTerm || filterBy !== "all") && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterBy("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PracticeCases;
