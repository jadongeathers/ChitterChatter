import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on?: string;
  accessible?: boolean;
  completed?: boolean;
}

interface PracticeCaseCardProps {
  practiceCase: PracticeCase;
  onStart: (id: number) => void;
}

const PracticeCaseCard: React.FC<PracticeCaseCardProps> = ({
  practiceCase,
  onStart,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAccessible = practiceCase.accessible;
  
  // Determine button text based on accessibility and completion status
  let buttonText = isAccessible
    ? practiceCase.completed
      ? "Practice Again"
      : "Start Practice"
    : `Available on ${new Date(practiceCase.accessible_on!).toLocaleDateString()}`;

  return (
    <motion.div 
      className="h-full"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="border border-gray-200 hover:border-blue-200 transition-all flex flex-col min-h-[275px] rounded-xl overflow-hidden shadow-sm hover:shadow-md">
        {/* Colored banner at top - soft colors */}
        <div className={`h-2 w-full ${practiceCase.completed ? "bg-green-200" : "bg-blue-200"}`}></div>
        
        <CardHeader className="flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <div className="text-sm font-medium text-gray-600">Practice Case</div>
            </div>
            <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5 mr-1 text-blue-400" />
              {Math.round(practiceCase.min_time / 60)}-
              {Math.round(practiceCase.max_time / 60)} min
            </div>
          </div>

          <CardTitle className="mt-2 text-lg font-bold text-gray-800">{practiceCase.title}</CardTitle>
          <CardDescription className="line-clamp-3 max-h-[64px] overflow-hidden text-gray-600">
            {practiceCase.description}
          </CardDescription>

          {/* Read More Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-blue-500 hover:text-blue-600 hover:underline inline-flex items-center mt-2 font-medium"
          >
            Read more
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>

          {practiceCase.completed && (
            <p className="text-green-500 text-sm">Completed</p>
          )}
        </CardHeader>

        {/* Button Always at the Bottom */}
        <CardContent className="mt-auto flex flex-col pt-0 pb-5">
          <Button
            className={`w-full rounded-full ${
              !isAccessible
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300"
                : practiceCase.completed
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            onClick={() => isAccessible && onStart(practiceCase.id)}
            disabled={!isAccessible}
          >
            {buttonText}
          </Button>
        </CardContent>
      </Card>

      {/* Read More Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">{practiceCase.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              <span className="font-semibold">Description: </span>
              <span className="font-normal">{practiceCase.description}</span>
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Time: </span>
              <span className="font-normal">
                {Math.round(practiceCase.min_time / 60)}-
                {Math.round(practiceCase.max_time / 60)} minutes
              </span>
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Available On: </span>
              <span className="font-normal">
                {practiceCase.accessible_on
                  ? new Date(practiceCase.accessible_on).toLocaleDateString()
                  : "Available Now"}
              </span>
            </p>
            {practiceCase.accessible && (
              <Button
                className="w-full mt-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => {
                  setIsModalOpen(false);
                  onStart(practiceCase.id);
                }}
                disabled={!isAccessible}
              >
                {practiceCase.completed ? "Practice Again" : "Start Practice"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PracticeCaseCard;