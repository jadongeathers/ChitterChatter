import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import PracticeCaseCard from "@/components/instructor/PracticeCaseCard";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Search, Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  class_id: number;
  published: boolean;
  created_at?: string;
  accessible_on?: string;
}

const Lessons: React.FC = () => {
  const { selectedClass, apiParams, classDisplayName } = useClass();
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<PracticeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const navigate = useNavigate();

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
    } catch (err) {
      console.error("Error fetching practice cases:", err);
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
    if (filterBy === "published") {
      filtered = filtered.filter((case_) => case_.published);
    } else if (filterBy === "draft") {
      filtered = filtered.filter((case_) => !case_.published);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          if (!a.created_at || !b.created_at) return 0;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          if (!a.created_at || !b.created_at) return 0;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "duration":
          return a.min_time - b.min_time;
        default:
          return 0;
      }
    });

    setFilteredCases(filtered);
  };

  // Handle case updates from PracticeCaseCard
  const handleCaseUpdate = (updatedCase: PracticeCase) => {
    setPracticeCases(prevCases => 
      prevCases.map(case_ => 
        case_.id === updatedCase.id ? updatedCase : case_
      )
    );
  };

  // Handle case deletion from PracticeCaseCard
  const handleCaseDelete = (deletedCaseId: number) => {
    setPracticeCases(prevCases => 
      prevCases.filter(case_ => case_.id !== deletedCaseId)
    );
  };

  // Navigate to add new case page
  const handleAddCase = () => {
    const route = selectedClass 
      ? `/instructor/review/new?class_id=${selectedClass.class_id}`
      : "/instructor/review/new";
    navigate(route);
  };

  // Helper functions for display text
  const getPageDescription = () => {
    if (selectedClass) {
      return `Manage and edit practice cases for ${selectedClass.course_code}`;
    }
    return "Manage and edit your practice cases across all classes";
  };

  const getEmptyStateMessage = () => {
    if (searchTerm || filterBy !== "all") {
      return "No practice cases match your current filters. Try adjusting your search or filter options.";
    }
    if (selectedClass) {
      return `No practice cases found for ${selectedClass.course_code}. Create your first case to get started.`;
    }
    return "No practice cases found across your classes. Create your first case to get started.";
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

  const getPublishedCount = () => {
    return practiceCases.filter(case_ => case_.published).length;
  };

  const getDraftCount = () => {
    return practiceCases.filter(case_ => !case_.published).length;
  };

  // Effects
  useEffect(() => {
    fetchPracticeCases();
  }, [selectedClass]);

  useEffect(() => {
    filterAndSortCases();
  }, [practiceCases, searchTerm, sortBy, filterBy]);

  return (
    <ClassAwareLayout
      title="Lessons"
      description={getPageDescription()}
    >
      {/* Enhanced Stats and Controls */}
      <div className="mb-8 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">{practiceCases.length}</div>
                  <div className="text-sm text-blue-700">Total Cases</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">{getPublishedCount()}</div>
                  <div className="text-sm text-green-700">Published</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-orange-600 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-900">{getDraftCount()}</div>
                  <div className="text-sm text-orange-700">Drafts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="p-6 bg-white shadow-sm">
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
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
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
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Case Button */}
            <Button onClick={handleAddCase} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Case
            </Button>
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
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading practice cases...</span>
        </div>
      ) : (
        /* Practice Cases Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          <AnimatePresence>
            {filteredCases.map((practiceCase, index) => (
              <motion.div
                key={practiceCase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PracticeCaseCard 
                  practiceCase={practiceCase} 
                  onCaseUpdate={handleCaseUpdate}
                  onCaseDelete={handleCaseDelete}
                />
              </motion.div>
            ))}

            {/* Add a Case Card - Only show if no filters applied */}
            {!searchTerm && filterBy === "all" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: filteredCases.length * 0.05 }}
                className="flex"
              >
                <div
                  onClick={handleAddCase}
                  className="hover:shadow-lg hover:border-blue-500 transition-all duration-200 cursor-pointer flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 h-full w-full min-h-[200px] group"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                      <Plus className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-lg font-medium text-blue-600 group-hover:text-blue-700">
                      Add a Case
                    </div>
                    {selectedClass && (
                      <div className="text-sm text-blue-500">
                        for {selectedClass.course_code}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Enhanced Empty State */}
      {!isLoading && filteredCases.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm || filterBy !== "all" ? "No matches found" : "No practice cases yet"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {getEmptyStateMessage()}
          </p>
          {(!searchTerm && filterBy === "all") && (
            <Button onClick={handleAddCase} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Case
            </Button>
          )}
          {(searchTerm || filterBy !== "all") && (
            <div className="space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                }}
              >
                Clear Filters
              </Button>
              <Button onClick={handleAddCase} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Case
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </ClassAwareLayout>
  );
};

export default Lessons;