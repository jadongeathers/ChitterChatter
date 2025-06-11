import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { fetchWithAuth } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext"; // ← ADD THIS IMPORT
import ConsentForm from "@/components/common/ConsentForm";
import StudentSurvey from "@/components/student/StudentSurvey";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ← ADD THIS HOOK
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequiredMessage, setShowRequiredMessage] = useState(false);
  const [requiredMessage, setRequiredMessage] = useState("");
  const [showCompletionThankYou, setShowCompletionThankYou] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
  
    try {
      const response = await fetchWithAuth("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid email or password");
      }
  
      const data = await response.json();
      setUserData(data);
  
      // Check if user needs to provide consent
      if (data.needs_consent) {
        setShowConsentForm(true);
        setIsSubmitting(false);
        return;
      }
  
      // If they've consented, check if they need to complete the survey
      if (data.user.is_student && !data.user.has_completed_survey) {
        try {
          const surveyResponse = await fetchWithAuth(`/api/surveys/status/${data.user.id}`);
          
          if (surveyResponse.ok) {
            const surveyData = await surveyResponse.json();
            
            if (!surveyData.completedSurveys?.includes('pre') && !surveyData.has_completed_survey) {
              setShowSurvey(true);
              setIsSubmitting(false);
              return;
            }
          } else {
            // If we can't check survey status, show the survey to be safe
            setShowSurvey(true);
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          // If error occurs, show the survey to be safe
          setShowSurvey(true);
          setIsSubmitting(false);
          return;
        }
      }
  
      // If they've completed consent and survey, check if access is restricted
      if (data.access_restricted) {
        setAccessMessage(data.access_message);
        setShowAccessDialog(true);
        setIsSubmitting(false);
        return;
      }
  
      // If all checks pass, complete login
      completeLogin(data);
  
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };
  
  const handleConsentComplete = async () => {
    // After consent is complete, show the survey if the user is a student
    if (userData.user.is_student) {
      setShowConsentForm(false);
      setShowSurvey(true);
    } else {
      // If not a student, proceed directly to the app
      completeLogin(userData);
    }
  };

  const handleConsentCancel = () => {
    // Show required message
    setRequiredMessage("You must consent to the research study to access ChitterChatter.");
    setShowRequiredMessage(true);
    
    // Clear form data
    setShowConsentForm(false);
    setUserData(null);
    setPassword("");  // Clear password for security
  };

  const handleSurveyComplete = () => {
    // After survey is complete, proceed to the app
    // Update the user data to reflect that the survey is now complete
    if (userData && userData.user) {
      userData.user.has_completed_survey = true;
    }
    setShowSurvey(false);
    setShowCompletionThankYou(true);
  };

  const handleSurveySkip = () => {
    // Survey is mandatory, show required message
    setRequiredMessage("You must complete the survey to access ChitterChatter.");
    setShowRequiredMessage(true);
    setShowSurvey(false);
  };

  const completeLogin = (data: any) => {
    // Store access token & user data (KEEP THIS - still needed)
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_role", data.user.is_student ? "student" : "instructor");
    localStorage.setItem("is_master", JSON.stringify(data.user.is_master));
    
    // ← ADD THIS: Update AuthContext state AFTER storing token
    const userRole = data.user.is_master ? "master" : (data.user.is_student ? "student" : "instructor");
    login(userRole, data.access_token);
    
    // Redirect user based on role
    if (data.user.is_master) {
      navigate("/master/dashboard");
    } else if (data.user.is_student) {
      navigate("/dashboard"); // Student dashboard route
    } else {
      navigate("/instructor/dashboard"); // Instructor dashboard route
    }
  };

  // ... rest of your component remains exactly the same
  
  // If we're showing the consent form, return that directly
  if (showConsentForm) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex h-screen flex-col items-center justify-center"
      >
        <ConsentForm 
          email={email}
          accessGroup={userData?.user?.access_group || ""}
          isStudent={userData?.user?.is_student || true}
          onComplete={handleConsentComplete}
          onCancel={handleConsentCancel}
        />
      </motion.div>
    );
  }

  // If we're showing the survey, return that
  if (showSurvey) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex h-screen flex-col items-center justify-center"
      >
        <StudentSurvey 
          email={email}
          user={userData.user}
          onComplete={handleSurveyComplete}
          onSkip={handleSurveySkip}
        />
      </motion.div>
    );
  }

  // If showing the required message
  if (showRequiredMessage) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex h-screen flex-col items-center justify-center"
      >
        <Card className="w-[500px] max-w-[95vw]">
          <CardHeader>
            <CardTitle className="text-center">Consent Needed for Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>{requiredMessage}</p>
            <Button 
              onClick={() => {
                setShowRequiredMessage(false);
                setPassword("");
              }} 
              className="w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (showCompletionThankYou) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex h-screen flex-col items-center justify-center"
      >
        <Card className="w-[500px] max-w-[95vw]">
          <CardHeader>
            <CardTitle className="text-center">Registration Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="font-semibold mb-2">Thank you for completing the process!</p>
              {userData?.user?.is_student && (
                <>
                  <p>You've been assigned to <span className="font-semibold">Group {userData.user.access_group}</span>.</p>
                  {userData.user.access_group === "A" && (
                    <p className="text-sm mt-2">You can access the tool from March 10, 2025, to March 30, 2025.</p>
                  )}
                  {userData.user.access_group === "B" && (
                    <p className="text-sm mt-2">You can access the tool from April 7, 2025, to April 27, 2025.</p>
                  )}
                  {userData.user.access_group === "All" && (
                    <p className="text-sm mt-2">You have full access.</p>
                  )}
                  {userData.user.access_group === "Normal" && (
                    <p className="text-sm mt-2">You have access until April 27th, 2025.</p>
                  )}
                </>
              )}
            </div>
            
            <Button onClick={() => setShowCompletionThankYou(false)} className="w-full">
              Proceed to Login
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Otherwise show the login form
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.5 }}
      className="flex h-screen flex-col items-center justify-center"
    >
      {/* Animated ChitterChatter Logo */}
      <motion.img
        src="/images/logo2.png"
        alt="ChitterChatter Logo"
        className="mb-1 w-auto h-24" 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* "ChitterChatter" Text with Atma Font */}
      <motion.h1
        className="font-logo text-3xl font-bold text-primary mb-5"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
      >
        ChitterChatter
      </motion.h1>

      <motion.div
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* Smooth Link to Register */}
            <motion.p 
              className="text-center text-sm mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.0 }}
            >
              Don't have an account?{" "}
              <motion.span 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register" className="text-blue-500 underline">
                  Register here
                </Link>
              </motion.span>
              <p className="text-gray-500 text-xs mt-2">Having trouble logging in? Contact jag569@cornell.edu.</p>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Access Restriction Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle>We Can't Wait to See You, Too!</DialogTitle>
          <DialogDescription className="text-center">
            <img
              src="/images/logo2.png"
              alt="ChitterChatter Logo"
              className="mx-auto mb-4 h-auto max-h-24 w-auto"
            />
            {accessMessage}
          </DialogDescription>
          <Button onClick={() => setShowAccessDialog(false)} className="w-full">OK</Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Login;