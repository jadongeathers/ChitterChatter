import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ For smooth animations
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
  
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.status === 403 && data.error === "Access restricted") {
        setAccessMessage(data.message);
        setShowAccessDialog(true);
        return;
      }
  
      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password");
      }
  
      // Store access token & user data
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.user.is_student ? "student" : "instructor");
      localStorage.setItem("is_master", JSON.stringify(data.user.is_master)); // ✅ Store is_master flag
      console.log(data.user);
      // Redirect user based on is_master property
      if (data.user.is_master) {
        navigate("/master/dashboard"); // ✅ Redirect Master to Master Dashboard
      } else {
        navigate("/"); // Default route for other users
      }
  
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
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
      {/* ✅ Animated ChitterChatter Logo */}
      <motion.img
        src="/images/logo2.png"
        alt="ChitterChatter Logo"
        className="mb-1 w-auto h-24" // ✅ Adjusted margin
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* ✅ "ChitterChatter" Text with Atma Font */}
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
              <Button type="submit" className="w-full">Login</Button>
            </form>

            {/* ✅ Smooth Link to Register */}
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
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ✅ Access Restriction Dialog */}
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
