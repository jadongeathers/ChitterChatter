import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Wifi, WifiOff } from "lucide-react";
import Timer from "./Timer";
import AIImage from "./AIImage";
import SpeechAndControlsPanel from "./SpeechAndControlsPanel";

interface PracticeCase {
  id: number;
  institution: string;
  class_name: string;
  description: string;
  system_prompt: string;
  image_url?: string;
  notes_for_students?: string;
}

interface ConversationAreaProps {
  currentMessage: string;
  showHint: boolean;
  onToggleShowHint: () => void;
  stopSession: () => void;
  status: string;
  error: string | null;
  remoteStream: MediaStream | null;
  timerMin: number;
  timerMax: number;
  timeElapsed: number;
  onTimerUp: () => void;
  canStop: boolean;
  onTick?: (elapsed: number) => void;
  isEndingConversation?: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  totalPausedTime: number;
  scenarioImageUrl?: string | null;
  additionalInformation?: string;
  practiceCase?: PracticeCase | null;
}

const ConversationArea: React.FC<ConversationAreaProps> = ({
  currentMessage,
  showHint,
  onToggleShowHint,
  stopSession,
  status,
  error,
  remoteStream,
  timerMin,
  timerMax,
  timeElapsed,
  onTimerUp,
  canStop,
  onTick,
  isEndingConversation,
  isPaused,
  onPause,
  onResume,
  totalPausedTime,
  scenarioImageUrl,
  additionalInformation,
  practiceCase,
}) => {
  const [displayTime, setDisplayTime] = useState(0);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionModalType, setConnectionModalType] = useState<'connecting' | 'connected'>('connecting');

  // Handle connection status changes
  useEffect(() => {
    if (status === "Connecting...") {
      setShowConnectionModal(true);
      setConnectionModalType('connecting');
    } else if (status === "Connected") {
      // Show connected state briefly before fading out
      setConnectionModalType('connected');
      const timer = setTimeout(() => {
        setShowConnectionModal(false);
      }, 1500); // Show "Connected" for 1.5 seconds before fading
      
      return () => clearTimeout(timer);
    } else if (status === "Disconnected" || status === "Failed") {
      setShowConnectionModal(false);
    }
  }, [status]);

  // Determine if we have an image to show
  const hasImage = scenarioImageUrl && scenarioImageUrl.trim() !== "";

  return (
    <div className="h-screen flex flex-col">
      {/* Hidden Timer Component */}
      <div style={{ display: "none" }}>
        <Timer
          minTime={timerMin}
          maxTime={timerMax}
          onTimeUp={onTimerUp}
          onTick={(elapsed) => {
            setDisplayTime(elapsed);
            onTick?.(elapsed);
          }}
          startTimer={status === "Connected" || status === "Paused" || status === "Resuming..."}
          isPaused={isPaused}
          totalPausedTime={totalPausedTime}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          {hasImage ? (
            // Two-column layout when image is available
            <div className="grid grid-cols-2 gap-8" style={{ height: '70vh' }}>
              {/* Left Column - Image */}
              <div className="flex items-center justify-center">
                <AIImage scenarioImageUrl={scenarioImageUrl!} />
              </div>

              {/* Right Column - Combined Speech and Controls */}
              <SpeechAndControlsPanel
                remoteStream={remoteStream}
                isPaused={isPaused}
                currentMessage={currentMessage}
                showHint={showHint}
                onToggleShowHint={onToggleShowHint}
                additionalInformation={additionalInformation}
                status={status}
                displayTime={displayTime}
                timerMin={timerMin}
                timerMax={timerMax}
                onPause={onPause}
                onResume={onResume}
                canStop={canStop}
                stopSession={stopSession}
                conversationDescription={practiceCase?.description}
                notesForStudents={practiceCase?.notes_for_students}
              />
            </div>
          ) : (
            // Single-column layout when no image
            <div className="max-w-2xl mx-auto" style={{ height: '70vh' }}>
              <SpeechAndControlsPanel
                remoteStream={remoteStream}
                isPaused={isPaused}
                currentMessage={currentMessage}
                showHint={showHint}
                onToggleShowHint={onToggleShowHint}
                additionalInformation={additionalInformation}
                status={status}
                displayTime={displayTime}
                timerMin={timerMin}
                timerMax={timerMax}
                onPause={onPause}
                onResume={onResume}
                canStop={canStop}
                stopSession={stopSession}
                conversationDescription={practiceCase?.description}
              />
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Modal */}
      <AnimatePresence>
        {showConnectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className={`shadow-2xl border-2 ${
              connectionModalType === 'connecting' 
                ? 'bg-gray-50 border-gray-300' 
                : 'bg-green-50 border-green-300'
            }`}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={connectionModalType === 'connecting' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: connectionModalType === 'connecting' ? Infinity : 0,
                      ease: "easeInOut" 
                    }}
                  >
                    {connectionModalType === 'connecting' ? (
                      <WifiOff className="w-12 h-12 text-gray-500" />
                    ) : (
                      <Wifi className="w-12 h-12 text-green-600" />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <p className={`text-xl font-semibold ${
                      connectionModalType === 'connecting' 
                        ? 'text-gray-700' 
                        : 'text-green-700'
                    }`}>
                      {connectionModalType === 'connecting' ? 'Connecting...' : 'Connected!'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      connectionModalType === 'connecting' 
                        ? 'text-gray-600' 
                        : 'text-green-600'
                    }`}>
                      {connectionModalType === 'connecting' 
                        ? 'Please wait while we establish connection' 
                        : 'You can now start speaking'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Notification */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40"
          >
            <Card className="bg-orange-50 border-orange-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Pause className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Session Paused</p>
                    <p className="text-sm text-orange-700">The AI cannot hear you while paused</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40"
          >
            <Card className="bg-red-50 border-red-200 shadow-lg max-w-md">
              <CardContent className="p-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationArea;