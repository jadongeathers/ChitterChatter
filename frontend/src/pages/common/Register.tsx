import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchWithAuth } from "@/utils/api";
import ConsentForm from "@/components/common/ConsentForm";
import SurveyRedirect from "@/components/student/SurveyRedirect";

// Enum for registration steps
enum RegistrationStep {
  EMAIL_VERIFICATION,
  ACCOUNT_DETAILS,
  CONSENT_FORM,
  SURVEY,
  GROUP_ASSIGNMENT
}

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(RegistrationStep.EMAIL_VERIFICATION);
  
  // User data
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Status and messages
  const [error, setError] = useState("");
  const [accessGroup, setAccessGroup] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [isStudent, setIsStudent] = useState(true); // Default to student
  const [userId, setUserId] = useState<string | null>(null);

  const verifyEmail = async () => {
    try {
      setError("");
      const response = await fetchWithAuth("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setAccessGroup(data.access_group || "Unknown");
        
        // Determine if user is a student based on access group
        // "All" access group is typically for instructors
        setIsStudent(data.access_group !== "All");

        // Set access message based on assigned group
        if (data.access_group === "A") {
          setAccessMessage("You can access the tool from March 10, 2025, to March 30, 2025.");
        } else if (data.access_group === "B") {
          setAccessMessage("You can access the tool from April 7, 2025, to April 27, 2025.");
        } else {
          setAccessMessage("You have full access.");
        }
        
        // Move to account details step
        setCurrentStep(RegistrationStep.ACCOUNT_DETAILS);
      } else {
        setError(data.error || "Email verification failed.");
      }
    } catch (err: any) {
      setError("Server error. Try again later.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetchWithAuth("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Registration failed.");
      }
      
      const data = await response.json();
      if (data.user_id) {
        setUserId(data.user_id);
      }
      
      // Move to consent form step
      setCurrentStep(RegistrationStep.CONSENT_FORM);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleConsentComplete = () => {
    // If student, go to survey step, otherwise go to final step
    if (isStudent) {
      setCurrentStep(RegistrationStep.SURVEY);
    } else {
      setCurrentStep(RegistrationStep.GROUP_ASSIGNMENT);
    }
  };
  
  const handleSurveyComplete = () => {
    // Move to final step after survey
    setCurrentStep(RegistrationStep.GROUP_ASSIGNMENT);
  };
  
  // New handler for canceling consent
  const handleConsentCancel = () => {
    // Return to account details step if user cancels consent
    setCurrentStep(RegistrationStep.ACCOUNT_DETAILS);
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case RegistrationStep.EMAIL_VERIFICATION:
        return (
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">Register</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Institutional Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button onClick={verifyEmail} className="w-full">
                  Verify Email
                </Button>
                
                <motion.p className="text-center text-sm mt-4">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-500 underline">
                    Login here
                  </Link>
                </motion.p>
              </div>
            </CardContent>
          </Card>
        );
        
      case RegistrationStep.ACCOUNT_DETAILS:
        return (
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">Create Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-md text-center">
                  <p className="font-semibold">Your email: {email}</p>
                </div>
                
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </form>
            </CardContent>
          </Card>
        );
        
      case RegistrationStep.CONSENT_FORM:
        return (
          <ConsentForm 
            email={email} 
            accessGroup={accessGroup}
            isStudent={isStudent}
            onComplete={handleConsentComplete}
            onCancel={handleConsentCancel}
          />
        );
        
      case RegistrationStep.SURVEY:
        return (
          <SurveyRedirect
            email={email}
            user={{
              is_student: isStudent,
              first_name: firstName,
              last_name: lastName
            }}
            onComplete={handleSurveyComplete}
          />
        );
        
      case RegistrationStep.GROUP_ASSIGNMENT:
        return (
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">Registration Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="font-semibold mb-2">Thank you for registering!</p>
                {isStudent && (
                  <>
                    <p>You've been assigned to <span className="font-semibold">Group {accessGroup}</span>.</p>
                    <p className="text-sm mt-2">{accessMessage}</p>
                  </>
                )}
              </div>
              
              <Button onClick={() => navigate("/login")} className="w-full">
                Proceed to Login
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.5 }}
      className="flex h-screen flex-col items-center justify-center"
    >
      {/* Logo and branding - only shown in first two steps */}
      {(currentStep === RegistrationStep.EMAIL_VERIFICATION || 
        currentStep === RegistrationStep.ACCOUNT_DETAILS) && (
        <>
          <motion.img
            src="/images/logo2.png"
            alt="ChitterChatter Logo"
            className="mb-1 w-auto h-24"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.h1
            className="font-logo text-3xl font-bold text-primary mb-5"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          >
            ChitterChatter
          </motion.h1>
        </>
      )}
      
      <motion.div
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {renderCurrentStep()}
      </motion.div>
    </motion.div>
  );
};

export default Register;