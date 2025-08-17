import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Mock AISpeech component - replace with your actual import
const AISpeech = ({ stream, isPaused }: { stream: MediaStream | null; isPaused: boolean }) => {
  if (!stream) return null;
  
  return (
    <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
      <div className="flex space-x-1">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-blue-500 rounded-full"
            animate={{
              height: isPaused ? [4, 4] : [4, 24, 4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface SpeechHandlerProps {
  remoteStream: MediaStream | null;
  isPaused: boolean;
  currentMessage: string;
  showHint: boolean;
  onToggleShowHint: () => void;
  additionalInformation?: string;
}

const SpeechHandler: React.FC<SpeechHandlerProps> = ({
  remoteStream,
  isPaused,
  currentMessage,
  showHint,
  onToggleShowHint,
  additionalInformation,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">AI</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPaused ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
          }`}>
            {isPaused ? 'Paused' : 'Active'}
          </div>
        </div>

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
          size="sm"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">AI Response</span>
          </div>
          {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>

        {/* AI Response Text (Expandable) */}
        <AnimatePresence>
          {showHint && currentMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 max-h-32 overflow-y-auto">
                  <motion.div
                    key={currentMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-700 leading-relaxed text-sm"
                  >
                    {currentMessage}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Information (when AI response is not showing) */}
        {!showHint && additionalInformation && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Additional Information</h4>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-3 max-h-32 overflow-y-auto">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                  {additionalInformation}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpeechHandler;