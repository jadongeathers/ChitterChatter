import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchWithAuth } from "@/utils/api";
import ConsentForm from "@/components/common/ConsentForm";

// Simplified enum for registration steps
enum RegistrationStep {
  EMAIL_VERIFICATION,
  ACCOUNT_DETAILS,
  CONSENT_FORM,
  COMPLETION
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
  const [isStudent, setIsStudent] = useState(true); // Default to student
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
        // Determine if user is a student (you can adjust this logic as needed)
        // For example, you could check email domain or have a different verification endpoint
        setIsStudent(data.is_student !== false); // Default to true unless explicitly false
        
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
      
      if (data.access_token) {
        setAccessToken(data.access_token);
      }
      
      // Move to consent form step
      setCurrentStep(RegistrationStep.CONSENT_FORM);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleConsentComplete = () => {
    // After consent, go directly to completion step
    setCurrentStep(RegistrationStep.COMPLETION);
  };
  
  const handleConsentCancel = () => {
    navigate("/login");  // Redirect to the login page
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
              <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-center">
                <p className="text-sm text-blue-700">{email}</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
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
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password && (
                    <div className="text-xs space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <p className="font-medium text-slate-700 mb-2">Password requirements:</p>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-slate-500'}`}>
                          <span className="text-xs">{password.length >= 8 ? '✓' : '○'}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-slate-500'}`}>
                          <span className="text-xs">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                          <span>Uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-slate-500'}`}>
                          <span className="text-xs">{/[a-z]/.test(password) ? '✓' : '○'}</span>
                          <span>Lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/\d/.test(password) ? 'text-green-600' : 'text-slate-500'}`}>
                          <span className="text-xs">{/\d/.test(password) ? '✓' : '○'}</span>
                          <span>At least one number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs">Passwords do not match</p>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={
                    password.length < 8 ||
                    !/[A-Z]/.test(password) ||
                    !/[a-z]/.test(password) ||
                    !/\d/.test(password) ||
                    password !== confirmPassword
                  }
                >
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
            accessGroup="" // Empty since access groups are removed
            isStudent={isStudent}
            onComplete={handleConsentComplete}
            onCancel={handleConsentCancel}
          />
        );
        
      case RegistrationStep.COMPLETION:
        return (
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">Registration Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="font-semibold mb-2">Thank you for registering!</p>
                <p>Your account has been successfully created.</p>
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