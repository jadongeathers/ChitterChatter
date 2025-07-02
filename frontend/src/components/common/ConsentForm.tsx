import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { fetchWithAuth } from "@/utils/api";
import StudentConsentForm from "../student/StudentConsentForm";
import InstructorConsentForm from "../instructor/InstructorConsentForm";

interface ConsentFormProps {
  email: string;
  accessGroup: string;
  isStudent: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const ConsentForm: React.FC<ConsentFormProps> = ({ 
  email, 
  accessGroup, 
  isStudent,
  onComplete,
  onCancel
}) => {
  const navigate = useNavigate();
  const [hasConsented, setHasConsented] = useState(false);
  const [showFullConsent, setShowFullConsent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitConsent = async () => {
    if (!hasConsented) {
      setError("You must consent to participate in the research study to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Record user's consent in the backend
      const response = await fetchWithAuth("/api/auth/record-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email,
          has_consented: hasConsented,
          access_group: accessGroup,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record consent");
      }

      // Move to the next step
      onComplete();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Content for consent summary (the short version shown initially)
  const getConsentSummary = () => {
    if (isStudent) {
      return (
        <>
          <p className="mb-4">
            We are envisioning the future of AI-enhanced language learning. By using ChitterChatter, you're helping contribute to the science of language learning!
          </p>
          <p className="mb-4">
            ChitterChatter is a research tool. If you use it, you will:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Get to work on your language speaking and listening skills</li>
            <li>Advance our understanding of AI pedagogy</li>
            <li>Potentially be contacted by our research team</li>
          </ul>
          <p className="mb-4">
            All data collected will be kept confidential and used only for research purposes.
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="mb-4">
            By using ChitterChatter, you are consenting to participate in a research study to understand how AI-powered tools can enhance language learning.
          </p>
          <p className="mb-4">
            ChitterChatter is a research tool. If you use it, you will:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Get the chance to design novel speaking practice activities</li>
            <li>Advance our understanding of AI pedagogy</li>
            <li>Potentially be contacted by our research team</li>
          </ul>
          <p className="mb-4">
            And all data collected will be kept confidential and used only for research purposes.
          </p>
        </>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-[700px] max-w-[95vw]">
        <CardHeader>
          <CardTitle className="text-center">Research Participation Consent</CardTitle>
          <CardDescription className="text-center">
            Before proceeding, please review and consent to participate in our research study
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md text-sm">
            {getConsentSummary()}
            
            <p>
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => setShowFullConsent(true)}
              >
                Click here to read the full consent document
              </Button>
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="consent" 
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked === true)}
            />
            <label 
              htmlFor="consent" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have read and understood the consent form. I voluntarily agree to participate in this research study.
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitConsent}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "I Agree"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Consent Document Dialog */}
      <Dialog open={showFullConsent} onOpenChange={setShowFullConsent}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Full Research Consent Document</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {isStudent ? <StudentConsentForm /> : <InstructorConsentForm />}
            
            <div className="pt-4">
              <Button 
                onClick={() => setShowFullConsent(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ConsentForm;