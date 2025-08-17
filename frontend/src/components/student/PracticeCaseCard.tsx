// components/student/PracticeCaseCard.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ChevronRight, BookOpen, Play, CheckCircle, Calendar } from "lucide-react";
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
    : `Available ${new Date(practiceCase.accessible_on!).toLocaleDateString()}`;

  const formatTimeRange = (minTime: number, maxTime: number) => {
    const minMinutes = Math.round(minTime / 60);
    const maxMinutes = Math.round(maxTime / 60);
    return `${minMinutes}-${maxMinutes} min`;
  };

  return (
    <>
      <motion.div 
        className="h-full"
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white overflow-hidden group">
          {/* Status indicator bar */}
          <div className={`h-1 w-full ${
            practiceCase.completed 
              ? "bg-gradient-to-r from-green-400 to-emerald-500" 
              : isAccessible
                ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                : "bg-gradient-to-r from-gray-300 to-gray-400"
          }`} />
          
          <CardHeader className="flex-grow pb-3">
            {/* Header with icon and time - Fixed height */}
            <div className="flex items-center justify-between mb-3 h-6">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${
                  practiceCase.completed 
                    ? "bg-green-100" 
                    : isAccessible 
                      ? "bg-blue-100" 
                      : "bg-gray-100"
                }`}>
                  {practiceCase.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : isAccessible ? (
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Calendar className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className="text-sm font-medium text-gray-600">Practice Case</div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                {formatTimeRange(practiceCase.min_time, practiceCase.max_time)}
              </div>
            </div>

            {/* Title - Limited to 2 lines with fixed height */}
            <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 mb-2 h-12 leading-6">
              {practiceCase.title}
            </CardTitle>
            
            {/* Description - Limited to 2 lines with fixed height */}
            <CardDescription className="line-clamp-2 text-gray-600 text-sm leading-5 mb-3 h-10">
              {practiceCase.description}
            </CardDescription>

            {/* Read More Link */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center font-medium transition-colors"
            >
              Read more
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </CardHeader>

          {/* Middle section - Fixed height for status badges */}
          <div className="px-6 pb-3">
            <div className="h-8 flex items-start">
              {practiceCase.completed && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              
              {!isAccessible && practiceCase.accessible_on && (
                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                  <Calendar className="h-3 w-3 mr-1" />
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>

          {/* Action Button - Fixed at bottom */}
          <CardContent className="pt-0 pb-6 mt-auto">
            <Button
              className={`w-full rounded-lg font-medium transition-all duration-200 ${
                !isAccessible
                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 cursor-not-allowed"
                  : practiceCase.completed
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
              }`}
              onClick={() => isAccessible && onStart(practiceCase.id)}
              disabled={!isAccessible}
            >
              {isAccessible && (
                <Play className="h-4 w-4 mr-2" />
              )}
              {buttonText}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-xl max-w-lg">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-lg ${
                practiceCase.completed 
                  ? "bg-green-100" 
                  : isAccessible 
                    ? "bg-blue-100" 
                    : "bg-gray-100"
              }`}>
                {practiceCase.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : isAccessible ? (
                  <BookOpen className="h-6 w-6 text-blue-600" />
                ) : (
                  <Calendar className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 text-left">
                  {practiceCase.title}
                </DialogTitle>
                {practiceCase.completed && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed">
                {practiceCase.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Duration</span>
                </div>
                <p className="text-blue-700">
                  {formatTimeRange(practiceCase.min_time, practiceCase.max_time)}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-purple-900">Availability</span>
                </div>
                <p className="text-purple-700">
                  {practiceCase.accessible_on
                    ? new Date(practiceCase.accessible_on).toLocaleDateString()
                    : "Available Now"}
                </p>
              </div>
            </div>

            {/* Action Button */}
            {isAccessible && (
              <Button
                className={`w-full rounded-lg font-medium py-3 transition-all duration-200 ${
                  practiceCase.completed
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                }`}
                onClick={() => {
                  setIsModalOpen(false);
                  onStart(practiceCase.id);
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                {practiceCase.completed ? "Practice Again" : "Start Practice"}
              </Button>
            )}

            {!isAccessible && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <Calendar className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-amber-700 font-medium">
                  This case will be available on {new Date(practiceCase.accessible_on!).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PracticeCaseCard;