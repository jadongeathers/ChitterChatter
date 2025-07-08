import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Pause, Play } from "lucide-react";
import AISpeech from "./AISpeech";
import TimerWrapper from "./TimerWrapper";

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
  // New pause props
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  totalPausedTime: number;
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
  totalPausedTime
}) => {
  console.log("ConversationArea props:", { timerMin, timerMax, timeElapsed, canStop, isPaused });

  return (
    <Card className="w-full max-w-2xl p-4 relative">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Conversation</CardTitle>
        <div className="flex flex-col items-end gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              status === "Connected" || status === "Paused"
                ? "bg-green-100 text-green-800"
                : status === "Error"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === "Connected" || status === "Paused"
                  ? "bg-green-500"
                  : status === "Error"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            />
            {status}
          </div>
          <TimerWrapper 
            minTime={timerMin} 
            maxTime={timerMax} 
            onTimeUp={onTimerUp} 
            onTick={onTick}
            startTimer={status === "Connected" || status === "Paused" || status === "Resuming..."} // Timer only starts when status is Connected
            isEndingConversation={isEndingConversation}
            isPaused={isPaused}
            totalPausedTime={totalPausedTime}
          />
        </div>
      </CardHeader>

      <CardContent>
        <Card className="p-4 shadow-md">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                AI
              </div>
              {remoteStream && <AISpeech stream={remoteStream} isPaused={isPaused} />}
            </div>
            <Button variant="ghost" size="sm" onClick={onToggleShowHint} className="border">
              {showHint ? "Hide" : "Show"} Hints
            </Button>
          </div>

          {showHint && (
            <div className="mt-2 h-32 overflow-y-auto px-4 py-2 border rounded">
              <AnimatePresence mode="wait">
                {currentMessage && (
                  <motion.div
                    key={currentMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="text-base leading-relaxed"
                  >
                    {currentMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Card>

        {(status === "Connected" || status === "Paused") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-3 mt-4">
            {/* Pause/Resume Button */}
            <Button
              onClick={isPaused ? onResume : onPause}
              variant={isPaused ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </Button>

            {/* Stop Button */}
            <Button
              onClick={stopSession}
              variant="destructive"
              className={!canStop ? "opacity-50" : ""}
            >
              End Conversation
            </Button>
          </motion.div>
        )}

        {/* Pause notification */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center"
          >
            <p className="text-gray-800 font-medium">
              Conversation is paused. The AI cannot hear you.
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Click Resume to continue the conversation.
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ConversationArea;