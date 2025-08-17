import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/utils/api";
import PracticeCaseCard from "@/components/instructor/PracticeCaseCard";
import { 
  Globe, 
  Search, 
  Filter, 
  SortAsc, 
  Download, 
  Star,
  BookOpen,
  Users,
  TrendingUp,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface LibraryCase {
  id: number;
  title: string;
  description: string;
  target_language: string;
  proficiency_level: string;
  min_time: number;
  max_time: number;
  author_name: string;
  author_institution?: string;
  library_tags: string[];
  library_downloads: number;
  library_rating?: number;
  library_rating_count: number;
  library_approved_at: string;
  situation_instructions: string;
  curricular_goals: string;
  behavioral_guidelines: string;
}

interface LibraryStats {
  total_cases: number;
  total_downloads: number;
  popular_languages: string[];
  popular_tags: string[];
}

const GlobalLibrary: React.FC = () => {
  const [cases, setCases] = useState<LibraryCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<LibraryCase[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch library cases and stats
  const fetchLibraryCases = async () => {
    try {
      setIsLoading(true);
      
      const [casesResponse, statsResponse] = await Promise.all([
        fetchWithAuth("/api/practice_cases/library"),
        fetchWithAuth("/api/practice_cases/library/stats")
      ]);
      
      if (!casesResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to fetch library data");
      }
      
      const casesData = await casesResponse.json();
      const statsData = await statsResponse.json();
      
      setCases(casesData.cases || []);
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching library data:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  // Filter and sort cases
  const filterAndSortCases = () => {
    let filtered = [...cases];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (case_) =>
          case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.library_tags.some(tag => 
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter((case_) => 
        case_.target_language.toLowerCase() === languageFilter.toLowerCase()
      );
    }

    // Apply tag filter
    if (tagFilter !== "all") {
      filtered = filtered.filter((case_) =>
        case_.library_tags.some(tag => 
          tag.toLowerCase() === tagFilter.toLowerCase()
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.library_approved_at).getTime() - new Date(a.library_approved_at).getTime();
        case "oldest":
          return new Date(a.library_approved_at).getTime() - new Date(b.library_approved_at).getTime();
        case "popular":
          return b.library_downloads - a.library_downloads;
        case "rating":
          return (b.library_rating || 0) - (a.library_rating || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredCases(filtered);
  };

  // Get unique languages for filter
  const getAvailableLanguages = () => {
    const languages = [...new Set(cases.map(c => c.target_language))];
    return languages.sort();
  };

  // Get popular tags for filter
  const getAvailableTags = () => {
    const allTags = cases.flatMap(c => c.library_tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // Top 20 tags
      .map(([tag]) => tag);
  };

  const getCaseCountText = () => {
    const filteredCount = filteredCases.length;
    const totalCount = cases.length;
    const caseText = filteredCount === 1 ? "case" : "cases";
    
    if (searchTerm || languageFilter !== "all" || tagFilter !== "all") {
      return `${filteredCount} of ${totalCount} ${caseText}`;
    }
    
    return `${totalCount} ${caseText} in the global library`;
  };

  useEffect(() => {
    fetchLibraryCases();
  }, []);

  useEffect(() => {
    filterAndSortCases();
  }, [cases, searchTerm, languageFilter, tagFilter, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Global Case Library</h1>
            <p className="text-gray-600">
              Discover and copy practice cases shared by instructors worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{stats.total_cases}</div>
                  <div className="text-sm text-gray-600">Total Cases</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-50 p-2 rounded-lg">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{stats.total_downloads}</div>
                  <div className="text-sm text-gray-600">Downloads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{stats.popular_languages.length}</div>
                  <div className="text-sm text-gray-600">Languages</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-50 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{stats.popular_tags.length}</div>
                  <div className="text-sm text-gray-600">Popular Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card className="p-6 bg-white shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cases, authors, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {getAvailableLanguages().map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Tags</SelectItem>
                  {getAvailableTags().map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Most Downloaded</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">{getCaseCountText()}</span>
            
            {/* Popular tags display */}
            {stats && stats.popular_tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-xs">Popular:</span>
                <div className="flex space-x-1">
                  {stats.popular_tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading library cases...</span>
        </div>
      ) : (
        /* Cases Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          <AnimatePresence>
            {filteredCases.map((case_, index) => (
              <motion.div
                key={case_.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PracticeCaseCard 
                  practiceCase={{
                    ...case_,
                    published: true,
                    is_draft: false,
                    accessible_on: case_.library_approved_at,
                    class_id: 0 // Library cases don't belong to a specific class
                  }}
                  isLibraryView={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCases.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Globe className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm || languageFilter !== "all" || tagFilter !== "all" 
              ? "No matches found" 
              : "No cases in library yet"
            }
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm || languageFilter !== "all" || tagFilter !== "all"
              ? "Try adjusting your search or filter options to find more cases."
              : "Be the first to contribute! Create and submit practice cases to help the community."
            }
          </p>
          {(searchTerm || languageFilter !== "all" || tagFilter !== "all") && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setLanguageFilter("all");
                setTagFilter("all");
              }}
            >
              Clear All Filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Contribution CTA */}
      {!isLoading && cases.length > 0 && (
        <div className="mt-12 text-center">
          <Card className="p-8 bg-gray-50 border-gray-200">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Share Your Expertise
              </h3>
              <p className="text-gray-600 mb-4">
                Help fellow instructors by contributing your own practice cases to the global library. 
                Every contribution makes language learning more accessible worldwide.
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = '/instructor/lessons'}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Contribute Your Cases
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GlobalLibrary;