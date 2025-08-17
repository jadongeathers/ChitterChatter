import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
  import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const TOTAL_STEPS = 2;
const BULLET_DELAY_MS = 550;
const WHO_STARTS_DELAY_MS = 450;
// NEXT appears only after the Who-Starts hint
const NEXT_AFTER_WHO_MS = 180;

const StartSessionDialog: React.FC<StartSessionDialogProps> = ({
  open,
  onOpenChange,
  practiceCase,
  onStart,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [visibleBullets, setVisibleBullets] = useState(0);
  const [showWhoStarts, setShowWhoStarts] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setVisibleBullets(0);
      setShowWhoStarts(false);
      setShowNextButton(false);
    }
  }, [open]);

  const step1Bullets = [
    "Speak naturally, like with a real person.",
    "Ask for clarification or slower speech if you need it.",
    "Take your time—no pressure to reply immediately.",
    "Mistakes are welcome. That’s how you learn.",
  ];

  // Step 1 timing: bullets → (delay) who-starts → (delay) continue button
  useEffect(() => {
    if (currentStep !== 1) return;

    if (visibleBullets < step1Bullets.length) {
      const t = setTimeout(() => setVisibleBullets((p) => p + 1), BULLET_DELAY_MS);
      return () => clearTimeout(t);
    }

    if (visibleBullets === step1Bullets.length && !showWhoStarts) {
      const tWho = setTimeout(() => setShowWhoStarts(true), WHO_STARTS_DELAY_MS);
      return () => clearTimeout(tWho);
    }

    if (showWhoStarts && !showNextButton) {
      const tNext = setTimeout(() => setShowNextButton(true), NEXT_AFTER_WHO_MS);
      return () => clearTimeout(tNext);
    }
  }, [currentStep, visibleBullets, showWhoStarts, showNextButton, step1Bullets.length]);

  // Step 2: show next immediately
  useEffect(() => {
    if (currentStep === 2) setShowNextButton(true);
  }, [currentStep]);

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((p) => p + 1);
      setVisibleBullets(0);
      setShowWhoStarts(false);
      setShowNextButton(false);
    } else {
      onStart();
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((p) => p - 1);
      setVisibleBullets(step1Bullets.length);
      setShowWhoStarts(true);
      setShowNextButton(true);
    }
  };

  const stepTitle = currentStep === 1 ? "Practice setup" : "Practice scenario";
  const stepLabel = currentStep === 1 ? "Step 1 of 2: How it works" : "Step 2 of 2: Scenario";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold">{stepTitle}</DialogTitle>

            {/* Step label + tiny segments (no weird dot) */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stepLabel}</span>
              <div className="grid grid-cols-2 gap-1 w-28">
                {[...Array(TOTAL_STEPS)].map((_, i) => {
                  const stepNum = i + 1;
                  const active = stepNum <= currentStep;
                  return (
                    <div
                      key={stepNum}
                      className={`h-1.5 rounded-full transition-colors ${
                        active ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <DialogDescription asChild>
          <div className="p-5">
            <div className="min-h-[360px] flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    className="flex-1"
                  >
                    <p className="text-muted-foreground mb-5 text-base">
                      You’ll speak with an AI partner to practice real conversation.
                    </p>

                    <div role="status" aria-live="polite" className="space-y-4">
                      {step1Bullets.map((bullet, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: index < visibleBullets ? 1 : 0,
                            y: index < visibleBullets ? 0 : 10,
                          }}
                          transition={{ duration: 0.22 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2.5 shrink-0" />
                          <p className="text-foreground text-base leading-relaxed">{bullet}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Delayed “You start the conversation” */}
                    {showWhoStarts && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                        className="mt-6"
                      >
                        <div className="flex items-start gap-2 text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <Info className="w-4 h-4 mt-0.5" />
                          <p>
                            <span className="font-medium">You start the conversation.</span>{" "}
                            When the status says <span className="font-medium">“Connected”</span>,
                            greet your partner and begin speaking naturally.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    className="flex-1"
                  >
                    {practiceCase?.image_url ? (
                      <>
                        {/* Image + description side by side */}
                        <div className="grid gap-6 md:grid-cols-[200px,1fr] items-start">
                          {/* Image */}
                          <div className="flex justify-center md:justify-start">
                            <div className="w-[200px] aspect-square rounded-lg overflow-hidden border bg-gray-100">
                              <img
                                src={practiceCase.image_url}
                                alt="Scenario"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                              Description
                            </h3>
                            <p className="text-foreground leading-relaxed text-base">
                              {practiceCase?.description}
                            </p>
                          </div>
                        </div>

                        {/* Show Text tip full width below */}
                        <div className="mt-6">
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-sm text-blue-900">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 mt-0.5" />
                                <p>
                                  <span className="font-medium">AI Response</span> shows what the AI says.
                                  For better learning, try listening exclusively; click AI Response only if you
                                  miss something.
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Full width description */}
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                            Description
                          </h3>
                          <p className="text-foreground leading-relaxed text-base">
                            {practiceCase?.description}
                          </p>
                        </div>

                        {/* Show Text tip full width below */}
                        <div className="mt-6">
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-sm text-blue-900">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 mt-0.5" />
                                <p>
                                  <span className="font-medium">AI Response</span> shows what the AI says.
                                  For better learning, try listening exclusively; click AI Response only if you
                                  miss something.
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="mt-auto pt-6 flex items-center justify-between">
                <Button variant="destructive" onClick={() => onOpenChange(false)} className="m-2">
                  Cancel
                </Button>

                {currentStep < TOTAL_STEPS ? (
                  <div className="flex items-center gap-2">
                    {/* Continue only shows after the who-starts hint */}
                    {showNextButton && showWhoStarts && (
                      <Button onClick={goNext} className="py-5 text-base m-2">
                        Continue
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={goBack} className="m-2 bg-gray-300 hover:bg-gray-400">
                      Back
                    </Button>
                    <Button
                      onClick={goNext}
                      className="py-5 text-base bg-blue-600 hover:bg-blue-700 text-white m-2"
                    >
                      Start conversation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionDialog;
