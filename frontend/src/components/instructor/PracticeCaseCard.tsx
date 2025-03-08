import React, { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Clock, ChevronRight } from "lucide-react";
import { fetchWithAuth } from "@/utils/api";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on?: string;
  published?: boolean;
}

interface PracticeCaseCardProps {
  practiceCase: PracticeCase;
}

const PracticeCaseCard: React.FC<PracticeCaseCardProps> = ({ practiceCase }) => {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(practiceCase.published || false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle Publish/Unpublish
  const handlePublishToggle = async () => {
    try {
      const response = await fetchWithAuth(`/api/practice_cases/publish/${practiceCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !isPublished }),
      });

      if (!response.ok) throw new Error("Failed to update publish status");

      setIsPublished(!isPublished);
    } catch (error) {
      console.error("Error updating publish status:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
        <CardHeader className="flex-grow">
            <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
                Practice Case
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {Math.round(practiceCase.min_time / 60)}-
                {Math.round(practiceCase.max_time / 60)} min
            </div>
            </div>

            <CardTitle className="mt-2">{practiceCase.title}</CardTitle>
            <CardDescription className="line-clamp-2">
            {practiceCase.description}
            </CardDescription>

            {/* Read More Button */}
            <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-blue-500 hover:underline inline-flex items-center mt-2"
            >
            Read more
            <ChevronRight className="h-4 w-4 ml-1" />
            </button>
        </CardHeader>

        <CardContent className="flex flex-col mt-auto">
            {/* Accessible On Date */}
            <div className="text-sm font-semibold text-muted-foreground mt-2 mb-2">
            Accessible On:{" "}
            {practiceCase.accessible_on
                ? new Date(practiceCase.accessible_on).toLocaleString()
                : "Not Set"}
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-muted-foreground"> Published </span>
            <Switch
                checked={isPublished}
                onCheckedChange={handlePublishToggle}
                className={`${isPublished ? "bg-green-500" : "bg-gray-300"}`}
            />
            </div>

            {/* Buttons */}
            <Button
            className="w-full bg-blue-500 text-white mt-2"
            onClick={() => navigate(`/instructor/review/${practiceCase.id}`)}
            >
                Edit Practice Case
            </Button>

            {/* ✅ Edit Feedback Button */}
            <Button
                className="w-full bg-blue-500 text-white mt-2"
                onClick={() => navigate(`/instructor/feedback/${practiceCase.id}`)}
            >
                Edit Feedback
            </Button>

            <Button
            className="w-full bg-green-500 text-white mt-2"
            onClick={() => navigate(`/practice/${practiceCase.id}`)}
            >
            Test the Practice Partner
            </Button>
        </CardContent>
        </Card>

      {/* Read More Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle className="font-semibold">{practiceCase.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
            <p>
                <span className="font-semibold">Description: </span>
                <span className="font-normal">{practiceCase.description}</span>
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
            </div>
        </DialogContent>
        </Dialog>

    </motion.div>
  );
};

export default PracticeCaseCard;
