import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, ChevronRight, Edit, Eye, AlertCircle, CheckCircle2, Share2, Globe, Download, MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { fetchWithAuth } from "@/utils/api";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on?: string;
  published: boolean;
  is_draft: boolean;
  class_id: number;
  created_at?: string;
  target_language?: string;
  situation_instructions?: string;
  curricular_goals?: string;
  behavioral_guidelines?: string;
  proficiency_level?: string;
  submitted_to_library?: boolean;
  library_approved?: boolean;
  library_submitted_at?: string;
  author_name?: string;
  author_institution?: string;
  library_tags?: string[];
  library_downloads?: number;
  library_rating?: number;
  library_rating_count?: number;
}

interface PracticeCaseCardProps {
  practiceCase: PracticeCase;
  onCaseUpdate?: (updatedCase: PracticeCase) => void;
  onCaseDelete?: (deletedCaseId: number) => void;
  isLibraryView?: boolean; // New prop for library display
}

const PracticeCaseCard: React.FC<PracticeCaseCardProps> = ({
  practiceCase,
  onCaseUpdate,
  onCaseDelete,
  isLibraryView = false,
}) => {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(practiceCase.published);
  const [isDraft, setIsDraft] = useState(practiceCase.is_draft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Library submission state
  const [authorName, setAuthorName] = useState("");
  const [authorInstitution, setAuthorInstitution] = useState("");
  const [libraryTags, setLibraryTags] = useState("");

  useEffect(() => {
    setIsPublished(practiceCase.published);
    setIsDraft(practiceCase.is_draft);
  }, [practiceCase.published, practiceCase.is_draft]);

  const validateForPublishing = () => {
    const errors = [];
    if (!practiceCase?.title?.trim()) errors.push("Title is required");
    if (!practiceCase?.description?.trim()) errors.push("Description is required");
    if (!practiceCase?.target_language?.trim()) errors.push("Target language is required");
    if (!practiceCase?.situation_instructions?.trim()) errors.push("Situation instructions are required");
    if (!practiceCase?.curricular_goals?.trim()) errors.push("Curricular goals are required");
    if (!practiceCase?.behavioral_guidelines?.trim()) errors.push("Behavioral guidelines are required");
    if (!practiceCase?.proficiency_level?.trim()) errors.push("Proficiency level is required");
    if (!practiceCase?.min_time || practiceCase.min_time < 60) errors.push("Minimum time must be at least 1 minute");
    if (!practiceCase?.max_time || practiceCase.max_time < practiceCase.min_time) errors.push("Maximum time must be greater than minimum time");
    if (!practiceCase?.accessible_on) errors.push("Access date and time are required");
    return errors;
  };

  const canPublish = () => {
    return validateForPublishing().length === 0;
  };

  const canSubmitToLibrary = () => {
    return canPublish() && isPublished && !practiceCase.submitted_to_library;
  };

  const getStatus = () => {
    if (practiceCase.library_approved) return { label: "In Library", color: "purple", icon: Globe };
    if (isPublished) return { label: "Live", color: "green", icon: Eye };
    if (isDraft) return { label: "Draft", color: "orange", icon: Edit };
    return { label: "Unpublished", color: "gray", icon: AlertCircle };
  };

  const status = getStatus();

  const handlePublishToggle = async () => {
    if (isUpdating || isLibraryView) return;
    
    if (!isPublished && !canPublish()) {
      alert("Cannot publish: Please complete all required fields first.");
      return;
    }
    
    setIsUpdating(true);

    try {
      const endpoint = `/api/practice_cases/publish/${practiceCase.id}`;
      const body = JSON.stringify({ published: !isPublished });

      const response = await fetchWithAuth(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update publish status");
      }

      const result = await response.json();
      const updated = result.case ?? {
        ...practiceCase,
        published: !isPublished,
        is_draft: isPublished,
      };

      setIsPublished(updated.published);
      setIsDraft(updated.is_draft);

      if (onCaseUpdate) onCaseUpdate(updated);
    } catch (error) {
      console.error("Error updating publish status:", error);
      alert(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLibrarySubmission = async () => {
    if (!authorName.trim()) {
      alert("Please enter your name for attribution.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetchWithAuth(`/api/practice_cases/submit_to_library/${practiceCase.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: authorName.trim(),
          author_institution: authorInstitution.trim() || null,
          tags: libraryTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit to library");
      }

      const result = await response.json();
      if (onCaseUpdate) onCaseUpdate(result.case);
      
      setIsLibraryModalOpen(false);
      alert("Case added to global library!");
    } catch (error) {
      console.error("Error submitting to library:", error);
      alert(error instanceof Error ? error.message : "Failed to submit to library");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyFromLibrary = async () => {
    if (!isLibraryView) return;
    
    setIsUpdating(true);
    try {
      const response = await fetchWithAuth(`/api/practice_cases/copy_from_library/${practiceCase.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: null // This should be set based on current class context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to copy case");
      }

      const result = await response.json();
      alert("Case copied to your drafts! You can now customize it.");
      navigate(`/instructor/review/${result.case.id}`);
    } catch (error) {
      console.error("Error copying case:", error);
      alert(error instanceof Error ? error.message : "Failed to copy case");
    } finally {
      setIsUpdating(false);
    }
  };

  const getCardStyling = () => {
    return "hover:shadow-lg transition-shadow flex flex-col h-full bg-white border-gray-200";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={getCardStyling()}>
        <CardHeader className="flex-grow">
          {/* Top row with type, status, and time */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {!isLibraryView && (
                <>
                  <div className="text-sm font-medium text-muted-foreground">
                    Practice Case
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      status.color === "green"
                        ? "border-green-400 text-green-600 bg-green-50"
                        : status.color === "orange"
                        ? "border-amber-400 text-amber-600 bg-amber-50"
                        : status.color === "purple"
                        ? "border-purple-400 text-purple-600 bg-purple-50"
                        : status.color === "blue"
                        ? "border-blue-400 text-blue-600 bg-blue-50"
                        : "border-gray-400 text-gray-600 bg-gray-50"
                    }`}
                  >
                    <status.icon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </>
              )}
            </div>

            {!isLibraryView && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {Math.round(practiceCase.min_time / 60)}-
                {Math.round(practiceCase.max_time / 60)} min
              </div>
            )}
          </div>

          {/* Title - Limited to 2 lines */}
          <CardTitle className="mb-2 line-clamp-2">
            {practiceCase.title || "Untitled Case"}
          </CardTitle>

          <CardDescription className="line-clamp-2 mb-3 h-10 leading-5">
            {practiceCase.description || "No description provided yet."}
          </CardDescription>

          {/* Library-specific info */}
          {isLibraryView && (
            <div className="space-y-2">
              {practiceCase.author_name && (
                <div className="text-sm text-muted-foreground">
                  by {practiceCase.author_name}
                  {practiceCase.author_institution && ` • ${practiceCase.author_institution}`}
                </div>
              )}
              
              {/* Downloads and rating in a cleaner layout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                    <Download className="h-3 w-3 mr-1" />
                    {practiceCase.library_downloads || 0}
                  </span>
                  <span className="flex items-center bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200">
                    ★ {practiceCase.library_rating ? practiceCase.library_rating.toFixed(1) : "0.0"} ({practiceCase.library_rating_count || 0})
                  </span>
                </div>
              </div>

              {/* Details section */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Details:</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {practiceCase.target_language && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 font-medium text-xs">
                      {practiceCase.target_language}
                    </Badge>
                  )}
                  <span className="flex items-center text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.round(practiceCase.min_time / 60)}-{Math.round(practiceCase.max_time / 60)} min
                  </span>
                </div>
              </div>
              
              {/* Tags in a better layout */}
              {practiceCase.library_tags && practiceCase.library_tags.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">Tags:</div>
                  <div className="flex flex-wrap gap-1">
                    {practiceCase.library_tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                    {practiceCase.library_tags.length > 2 && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        +{practiceCase.library_tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-blue-500 hover:underline inline-flex items-center mt-3"
          >
            Read more
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </CardHeader>
        <CardContent className="flex flex-col mt-auto">
          {/* Library view actions */}
          {isLibraryView ? (
            <Button
              className="w-full bg-blue-500 text-white"
              onClick={handleCopyFromLibrary}
              disabled={isUpdating}
            >
              <Download className="h-4 w-4 mr-2" />
              {isUpdating ? "Copying..." : "Copy & Customize"}
            </Button>
          ) : (
            <>
              {/* Regular case view */}
              <div className="text-sm font-semibold text-muted-foreground mt-2 mb-2">
                Accessible On:{" "}
                {practiceCase.accessible_on
                  ? new Date(practiceCase.accessible_on).toLocaleString()
                  : "Not Set"}
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-muted-foreground">Published</span>
                <Switch
                  checked={isPublished}
                  onCheckedChange={handlePublishToggle}
                  disabled={isUpdating}
                  className={isPublished ? "bg-green-500" : "bg-gray-300"}
                />
                {isUpdating && (
                  <span className="text-xs text-muted-foreground">Updating...</span>
                )}
              </div>

              {/* Status messages - Reserved space to maintain consistent height */}
              <div className="mb-4 h-16">
                {!canPublish() && isDraft && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Complete all required fields to publish this case.
                  </div>
                )}

                {canPublish() && !isPublished && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <CheckCircle2 className="h-3 w-3 inline mr-1" />
                    Ready to publish! All required fields are complete.
                  </div>
                )}

                {/* Library submission option */}
                {canSubmitToLibrary() && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <Globe className="h-3 w-3 inline mr-1" />
                    Share with the community! This case is ready for the global library.
                  </div>
                )}
              </div>

              {/* Horizontal Action Buttons */}
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => navigate(`/instructor/review/${practiceCase.id}`)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                
                {isPublished && !isDraft ? (
                  <Button
                    size="sm"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => navigate(`/practice/${practiceCase.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                )}
                
                {canSubmitToLibrary() ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsLibraryModalOpen(true)}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                ) : practiceCase.library_approved ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Shared
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-semibold flex items-center space-x-2">
              <span>{practiceCase.title || "Untitled Case"}</span>
              <Badge
                variant="outline"
                className={`text-xs ${
                  status.color === "green"
                    ? "border-green-400 text-green-600 bg-green-50"
                    : status.color === "orange"
                    ? "border-amber-400 text-amber-600 bg-amber-50"
                    : status.color === "purple"
                    ? "border-purple-400 text-purple-600 bg-purple-50"
                    : status.color === "blue"
                    ? "border-blue-400 text-blue-600 bg-blue-50"
                    : "border-gray-400 text-gray-600 bg-gray-50"
                }`}
              >
                <status.icon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <span className="font-semibold">Description: </span>
              <span className="font-normal">
                {practiceCase.description || "No description provided yet."}
              </span>
            </div>
            
            {practiceCase.target_language && (
              <div>
                <span className="font-semibold">Target Language: </span>
                <span className="font-normal">{practiceCase.target_language}</span>
              </div>
            )}
            
            {practiceCase.proficiency_level && (
              <div>
                <span className="font-semibold">Proficiency Level: </span>
                <span className="font-normal">{practiceCase.proficiency_level}</span>
              </div>
            )}
            
            <div>
              <span className="font-semibold">Time: </span>
              <span className="font-normal">
                {Math.round(practiceCase.min_time / 60)}-
                {Math.round(practiceCase.max_time / 60)} minutes
              </span>
            </div>
            
            {!isLibraryView && (
              <div>
                <span className="font-semibold">Accessible On: </span>
                <span className="font-normal">
                  {practiceCase.accessible_on
                    ? new Date(practiceCase.accessible_on).toLocaleString()
                    : "Not Set"}
                </span>
              </div>
            )}

            {isLibraryView && practiceCase.author_name && (
              <div>
                <span className="font-semibold">Created by: </span>
                <span className="font-normal">
                  {practiceCase.author_name}
                  {practiceCase.author_institution && ` (${practiceCase.author_institution})`}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Submission Modal */}
      <Dialog open={isLibraryModalOpen} onOpenChange={setIsLibraryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Global Library</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Once shared, this case cannot be removed from the global library. Other instructors will be able to copy and use it permanently.
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share this practice case with the global community! Other instructors will be able to copy and customize it for their classes.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="author-name">Your Name (for attribution) *</Label>
              <Input
                id="author-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Institution (optional)</Label>
              <Input
                id="institution"
                value={authorInstitution}
                onChange={(e) => setAuthorInstitution(e.target.value)}
                placeholder="University of Example"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={libraryTags}
                onChange={(e) => setLibraryTags(e.target.value)}
                placeholder="beginner, restaurant, formal conversation"
              />
              <p className="text-xs text-muted-foreground">
                Help others find your case with relevant tags
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsLibraryModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLibrarySubmission}
                disabled={isUpdating || !authorName.trim()}
                className="flex-1"
              >
                {isUpdating ? "Adding..." : "Add to Library"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PracticeCaseCard;