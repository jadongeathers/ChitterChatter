// src/components/VoiceChat/StartSessionDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PracticeCase {
  id: number;
  institution: string;
  class_name: string;
  description: string;
  system_prompt: string;
  image_url?: string;
}

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceCase: PracticeCase | null;
  onStart: () => void;
}

const StartSessionDialog: React.FC<StartSessionDialogProps> = ({
  open,
  onOpenChange,
  practiceCase,
  onStart,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Speaking Practice Session
          </DialogTitle>
        </DialogHeader>
        {/* Use `asChild` so our own wrapping element is used instead of a default <p> */}
        <DialogDescription asChild>
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                Description
              </h3>
              <p className="text-gray-700">{practiceCase?.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                How it Works
              </h3>
              <p className="text-gray-700">
                This tool helps you practice speaking naturally. During the
                conversation, you'll see a "Show Hint" button – clicking this
                will reveal the AI's message if you need help understanding what
                was said. However, you are encouraged to practice listening and
                speaking without relying on the text.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                Important Note
              </h3>
              <p className="text-gray-700">
                Please refrain from sharing any sensitive or personal information
                during the practice session.
              </p>
            </div>
          </div>
        </DialogDescription>
        <div className="flex justify-center mt-6">
          <Button
            onClick={onStart}
            className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionDialog;
