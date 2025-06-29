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
import { Clock, ChevronRight, Edit, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
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
}

interface PracticeCaseCardProps {
  practiceCase: PracticeCase;
  onCaseUpdate?: (updatedCase: PracticeCase) => void;
  onCaseDelete?: (deletedCaseId: number) => void;
}

const PracticeCaseCard: React.FC<PracticeCaseCardProps> = ({
  practiceCase,
  onCaseUpdate,
  onCaseDelete,
}) => {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(practiceCase.published);
  const [isDraft, setIsDraft] = useState(practiceCase.is_draft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔁 Sync local state with props if they change externally
  useEffect(() => {
    setIsPublished(practiceCase.published);
    setIsDraft(practiceCase.is_draft);
  }, [practiceCase.published, practiceCase.is_draft]);

  // Validation function - similar to ReviewCase
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

  const getStatus = () => {
    if (isPublished) return { label: "Published", color: "green", icon: Eye };
    if (isDraft) return { label: "Draft", color: "orange", icon: Edit };
    return { label: "Unpublished", color: "gray", icon: AlertCircle };
  };

  const status = getStatus();

  
  const handlePublishToggle = async () => {
    if (isUpdating) return;
    
    // Don't allow publishing if validation fails
    if (!isPublished && !canPublish()) {
      alert("Cannot publish: Please complete all required fields first.");
      return;
    }
    
    setIsUpdating(true);

    try {
      // Always use the simple publish toggle endpoint for the card
      const endpoint = `/api/practice_cases/publish/${practiceCase.id}`;
      const body = JSON.stringify({ published: !isPublished });

      const response = await fetchWithAuth(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  const getCardStyling = () => {
    return "hover:shadow-lg transition-shadow flex flex-col h-full bg-white";
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
                    : "border-gray-400 text-gray-600 bg-gray-50"
                }`}
              >
                <status.icon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {Math.round(practiceCase.min_time / 60)}-
              {Math.round(practiceCase.max_time / 60)} min
            </div>
          </div>

          <CardTitle className="mt-2">
            {practiceCase.title || "Untitled Case"}
            {isDraft && !practiceCase.title && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Draft in progress)
              </span>
            )}
          </CardTitle>

          <CardDescription className="line-clamp-2">
            {practiceCase.description || "No description provided yet."}
          </CardDescription>

          {(practiceCase.description || practiceCase.title) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-500 hover:underline inline-flex items-center mt-2"
            >
              Read more
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </CardHeader>

        <CardContent className="flex flex-col mt-auto">
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

          {/* Updated status message logic */}
          {!canPublish() && isDraft && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Complete all required fields to publish this case.
            </div>
          )}

          {canPublish() && !isPublished && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              Ready to publish! All required fields are complete.
            </div>
          )}

          <Button
            className="w-full bg-blue-500 text-white mt-2"
            onClick={() => navigate(`/instructor/review/${practiceCase.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Practice Case
          </Button>

          {isPublished && !isDraft && (
            <Button
              className="w-full bg-green-500 text-white mt-2"
              onClick={() => navigate(`/practice/${practiceCase.id}`)}
            >
              Test the Practice Partner
            </Button>
          )}

          {(isDraft || !isPublished) && !canPublish() && (
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Complete required fields to enable publishing
            </div>
          )}

          {(isDraft || !isPublished) && canPublish() && (
            <div className="mt-2 text-xs text-center text-green-600">
              All fields complete - ready to publish!
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
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
                    : "border-gray-400 text-gray-600 bg-gray-50"
                }`}
              >
                <status.icon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <span className="font-semibold">Description: </span>
              <span className="font-normal">
                {practiceCase.description || "No description provided yet."}
              </span>
            </p>
            <p>
              <span className="font-semibold">Time: </span>
              <span className="font-normal">
                {Math.round(practiceCase.min_time / 60)}-
                {Math.round(practiceCase.max_time / 60)} minutes
              </span>
            </p>
            <p>
              <span className="font-semibold">Accessible On: </span>
              <span className="font-normal">
                {practiceCase.accessible_on
                  ? new Date(practiceCase.accessible_on).toLocaleString()
                  : "Not Set"}
              </span>
            </p>
            
            {/* Updated modal status messages */}
            {!canPublish() && isDraft && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  <strong>Draft Status:</strong> This practice case is still being created.
                  Complete all required fields in the editor to publish it for students.
                </p>
              </div>
            )}

            {canPublish() && !isPublished && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  <strong>Ready to Publish:</strong> All required fields are complete! 
                  You can now publish this case to make it available to students.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PracticeCaseCard;