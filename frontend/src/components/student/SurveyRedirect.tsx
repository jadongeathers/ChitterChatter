import React, { useEffect, useState } from "react";
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
  Alert,
  AlertDescription
} from "@/components/ui/alert";
import { fetchWithAuth } from "@/utils/api";

interface SurveyRedirectProps {
  email: string;
  onComplete: () => void;
  user: {
    is_student: boolean;
    first_name?: string;
    last_name?: string;
  };
}

const SurveyRedirect: React.FC<SurveyRedirectProps> = ({ 
  email, 
  onComplete,
  user
}) => {
  const navigate = useNavigate();
  const [hasOpenedSurvey, setHasOpenedSurvey] = useState(false);

  // Only show to students
  if (!user.is_student) {
    setTimeout(() => onComplete(), 100);
    return null;
  }

  const SURVEY_URL = "https://cornell.ca1.qualtrics.com/jfe/form/SV_eX2Pz0yR9XVv2iq";
  const surveyUrl = `${SURVEY_URL}?email=${encodeURIComponent(email)}`;

  /**
   * Record the survey redirect in the backend.
   */
  useEffect(() => {
    const recordSurveyRedirect = async () => {
      try {
        await fetchWithAuth("/api/surveys/record-redirect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            survey_type: "pre",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("Failed to record survey redirect:", err);
      }
    };

    recordSurveyRedirect();
  }, [email]);

  /**
   * Open the survey and enable the continue button.
   */
  const openSurvey = () => {
    window.open(surveyUrl, "_blank");
    setHasOpenedSurvey(true); // Enable continue button
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
          <CardTitle className="text-center">Complete the Pre-Study Survey</CardTitle>
          <CardDescription className="text-center">
            Please take a moment to complete our pre-study survey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md text-sm">
            <p className="mb-4">
              Thank you for agreeing to participate in our research study! We just have three questions to get to know more about you and your language learning journey.
            </p>

            <p className="mb-4">
              The survey will take approximately 5 minutes to complete and will help us understand your current language learning experiences.
            </p>

            <p className="mb-4">
              <span className="font-semibold">Note:</span> Your email address ({email}) will be shared with the survey to help us match your responses to your ChitterChatter usage, but all data will be de-identified for analysis.
            </p>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-4">
              <p className="text-blue-800">
                <span className="font-semibold">Important:</span> Click "Open Survey in New Tab." After being redirected, click "Continue to ChitterChatter" to proceed.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center pt-4">
            <Button
              onClick={openSurvey}
              disabled={hasOpenedSurvey}
              className={`bg-primary ${hasOpenedSurvey ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {hasOpenedSurvey ? "Survey Opened" : "Open Survey in New Tab"}
            </Button>

            <Button
              onClick={onComplete}
              disabled={!hasOpenedSurvey}
              className={`${hasOpenedSurvey ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-300 cursor-not-allowed text-gray-500"}`}
            >
              Continue to ChitterChatter
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 pt-2">
            You can always return to complete the survey later if needed.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SurveyRedirect;
