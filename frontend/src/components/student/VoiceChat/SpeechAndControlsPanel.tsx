// components/.../SpeechAndControlsPanel.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Pause, 
  Play, 
  Square, 
  Clock,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AISpeech from "./AISpeech";

interface SpeechAndControlsPanelProps {
  // Speech Handler props
  remoteStream: MediaStream | null;
  isPaused: boolean;
  currentMessage: string;
  showHint: boolean;
  onToggleShowHint: () => void;
  additionalInformation?: string;
  
  // Controls Panel props
  status: string;
  displayTime: number;
  timerMin: number;
  timerMax: number;
  onPause: () => void;
  onResume: () => void;
  canStop: boolean;
  stopSession: () => void;

  // New props for conversation info
  conversationDescription?: string;

  // NEW: Student-facing notes from PracticeCase
  notesForStudents?: string | null;
}

const SpeechAndControlsPanel: React.FC<SpeechAndControlsPanelProps> = ({
  remoteStream,
  isPaused,
  currentMessage,
  showHint,
  onToggleShowHint,
  additionalInformation,
  status,
  displayTime,
  timerMin,
  timerMax,
  onPause,
  onResume,
  canStop,
  stopSession,
  conversationDescription,
  // NEW
  notesForStudents,
}) => {
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "Connected": return "bg-green-500";
      case "Paused": return "bg-orange-500";
      case "Error": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const progressPercentage = Math.min((displayTime / timerMax) * 100, 100);
  const minReached = displayTime >= timerMin;

  return (
    <>
      <div className="h-full min-h-0 flex flex-col gap-4">
        {/* Speech Section */}
        <Card className="flex-1">
          <CardContent className="p-6 h-full flex flex-col">
            {/* Audio Visualization */}
            {remoteStream && (
              <div className="mb-4">
                <AISpeech stream={remoteStream} isPaused={isPaused} />
              </div>
            )}

            {/* Show Response Button */}
            <Button
              onClick={onToggleShowHint}
              variant="outline"
              className="w-full justify-between mb-4"
              size="default"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>AI Response</span>
              </div>
              {showHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {/* AI Response Text (Expandable) */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 min-h-0"
                >
                  <Card className="bg-white border-gray-200 h-full">
                    <CardContent className="p-4 h-full overflow-y-auto">
                      {currentMessage ? (
                        <motion.div
                          key={currentMessage}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-gray-700 leading-relaxed"
                        >
                          {currentMessage}
                        </motion.div>
                      ) : (
                        <div className="text-gray-400 italic text-center py-4">
                          There is no response yet. Start chatting!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Additional Information (when AI response is not showing) */}
            {!showHint && additionalInformation && (
              <div className="flex-1 min-h-0">
                <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
                <Card className="bg-gray-50 border-gray-200 h-full">
                  <CardContent className="p-4 h-full overflow-y-auto">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {additionalInformation}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls Section */}
        <Card>
          <CardContent className="p-4">
            {/* Timer and Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
                <span className="font-medium text-gray-700 text-sm">{status}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="font-mono font-bold text-lg">{formatTime(displayTime)}</span>
                <span className="text-gray-500 text-sm">/ {formatTime(timerMax)}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {/* Minimum time marker */}
                <div 
                  className="absolute top-0 w-0.5 h-2 bg-green-500"
                  style={{ left: `${(timerMin / timerMax) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  Min: {formatTime(timerMin)}
                </span>
                {minReached && (
                  <span className="text-xs text-green-600 font-medium">✓ Minimum reached</span>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col lg:flex-row gap-3 justify-center">
              {/* Scenario Info Button */}
              {(conversationDescription || (notesForStudents && notesForStudents.trim())) && (
                <Button
                  onClick={() => setShowInfoDialog(true)}
                  variant="outline"
                  size="lg"
                  className="flex items-center justify-center gap-2 lg:w-auto order-3 lg:order-1"
                >
                  <Info className="w-4 h-4" />
                  Scenario Info
                </Button>
              )}

              <Button
                onClick={isPaused ? onResume : onPause}
                variant={isPaused ? "default" : "outline"}
                size="lg"
                className="flex items-center gap-2 flex-1 order-1 lg:order-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                )}
              </Button>
              
              <Button
                onClick={stopSession}
                variant="destructive"
                size="lg"
                className={`flex items-center gap-2 flex-1 order-2 lg:order-3 ${
                  !canStop 
                    ? 'opacity-50 cursor-pointer' 
                    : ''
                }`}
              >
                <Square className="w-5 h-5" />
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        {/* Fixed size dialog; inner content scrolls */}
        <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl h-[540px] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Conversation Scenario
                </DialogTitle>
            </DialogHeader>

            {/* Scrollable content */}
            <DialogDescription asChild>
                <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-6">
                {conversationDescription && (
                    <section>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        Description
                    </h3>
                    <p className="text-foreground leading-relaxed text-base whitespace-pre-wrap">
                        {conversationDescription}
                    </p>
                    </section>
                )}

                {notesForStudents && notesForStudents.trim() && (
                    <section>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        Notes for Students
                    </h3>
                    <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {notesForStudents}
                        </p>
                        </CardContent>
                    </Card>
                    </section>
                )}

                <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm text-blue-900">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5" />
                        <p>
                        Use the <span className="font-medium">AI Response</span> button above 
                        to see what the AI says if you need clarification during the conversation.
                        </p>
                    </div>
                    </AlertDescription>
                </Alert>
                </div>
            </DialogDescription>

            {/* Fixed footer */}
            <div className="border-t px-6 py-4 bg-white">
                <Button 
                onClick={() => setShowInfoDialog(false)}
                className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                Continue Conversation
                </Button>
            </div>
            </DialogContent>
      </Dialog>
    </>
  );
};

export default SpeechAndControlsPanel;
