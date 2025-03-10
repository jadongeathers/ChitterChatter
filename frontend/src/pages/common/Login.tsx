import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { fetchWithAuth } from "@/utils/api";
import ConsentForm from "@/components/common/ConsentForm";
import SurveyRedirect from "@/components/student/SurveyRedirect";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
      const data = await response.json();
  
      if (response.status === 403 && data.error === "Access restricted") {
        setAccessMessage(data.message);
        setShowAccessDialog(true);
        setIsSubmitting(false);
        return;
      }
  
      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password");
      }
  
      // Check if user needs to provide consent
      if (data.needs_consent) {
        setUserData(data);
        setShowConsentForm(true);
        setIsSubmitting(false);
        return;
      }
  
      // Store access token & user data
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.user.is_student ? "student" : "instructor");
      localStorage.setItem("is_master", JSON.stringify(data.user.is_master)); 
      
      // Redirect user based on role
      if (data.user.is_master) {
        navigate("/master/dashboard");
      } else if (data.user.is_student) {
        navigate("/dashboard"); // Student dashboard route
      } else {
        navigate("/instructor/dashboard"); // Instructor dashboard route
      }
  
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };
  
  const handleConsentComplete = async () => {
    // After consent is complete, show the survey if the user is a student
    if (userData && userData.user.is_student) {
      setShowConsentForm(false);
      setShowSurvey(true);
    } else if (userData && userData.access_token) {
      // If not a student, proceed directly to the app
      completeOnboarding();
    } else {
      // Fallback in case of issues
      navigate("/login");
    }
  };

  const handleSurveyComplete = () => {
    // After survey is complete (or skipped), proceed to the app
    completeOnboarding();
  };

  const completeOnboarding = () => {
    if (userData && userData.access_token) {
      // Store access token & user data
      localStorage.setItem("access_token", userData.access_token);
      localStorage.setItem("user_role", userData.user.is_student ? "student" : "instructor");
      localStorage.setItem("is_master", JSON.stringify(userData.user.is_master));
      
      // Redirect user based on role with specific paths
      if (userData.user.is_master) {
        navigate("/master/dashboard");
      } else if (userData.user.is_student) {
        navigate("/dashboard"); // Add this specific route
      } else {
        navigate("/instructor/dashboard"); // Add this specific route
      }
    } else {
      // Fallback in case of issues
      navigate("/login");
    }
  };

  // Function to handle consent cancellation
  const handleConsentCancel = () => {
    // Clear any stored data and show login form again
    setShowConsentForm(false);
    setShowSurvey(false);
    setUserData(null);
    setPassword("");  // Clear password for security
  };

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
        <SurveyRedirect 
          email={email}
          user={userData.user}
          onComplete={handleSurveyComplete}
        />
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
          <DialogTitle>Access Restricted</DialogTitle>
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