import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // 👈 --- Import useLocation
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import ConsentForm from "@/components/common/ConsentForm";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 --- Get location for redirect logic
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequiredMessage, setShowRequiredMessage] = useState(false);
  const [requiredMessage, setRequiredMessage] = useState("");

  // Determine where to redirect after a successful login.
  // This allows sending users back to the page they were trying to access.
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
  
    try {
      // The fetch logic is fine.
      const response = await fetch("/api/auth/login", { // Use fetch directly, fetchWithAuth might fail before token is set
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
  
      if (data.needs_consent) {
        setShowConsentForm(true);
        setIsSubmitting(false);
        return;
      }
  
      if (data.access_restricted) {
        setAccessMessage(data.access_message);
        setShowAccessDialog(true);
        setIsSubmitting(false);
        return;
      }
  
      completeLogin(data);
  
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };
  
  const handleConsentComplete = () => {
    completeLogin(userData);
  };

  const handleConsentCancel = () => {
    setRequiredMessage("You must consent to the research study to access ChitterChatter.");
    setShowRequiredMessage(true);
    setShowConsentForm(false);
    setUserData(null);
    setPassword("");
  };

  // 👇 --- THIS IS THE MAIN FIX FOR THE LOGIN FLOW --- 👇
  const completeLogin = (data: any) => {
    // 1. Determine the role from the user data
    const userRole = data.user.is_master ? "master" : (data.user.is_student ? "student" : "instructor");
    
    // 2. Call the context's login function. This is the SINGLE source of truth
    //    for setting state and localStorage. Pass the full user object.
    login(userRole, data.access_token, data.user);
    
    // 3. Navigate the user away from the login page.
    //    If they were trying to go somewhere specific, send them there.
    //    Otherwise, the root "/" will handle the redirect.
    navigate(from, { replace: true });
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
          accessGroup="" // Empty since access groups are removed
          isStudent={userData?.user?.is_student || true}
          onComplete={handleConsentComplete}
          onCancel={handleConsentCancel}
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

  // Show the login form
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