import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchWithAuth } from "@/utils/api";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [accessGroup, setAccessGroup] = useState("");
  const [accessMessage, setAccessMessage] = useState("");

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
        setIsEmailVerified(true);
        setAccessGroup(data.access_group || "Unknown");

        // Show access dates based on assigned group
        if (data.access_group === "A") {
          setAccessMessage("You can access the tool from March 10, 2025, to March 30, 2025.");
        } else if (data.access_group === "B") {
          setAccessMessage("You can access the tool from April 7, 2025, to April 27, 2025.");
        } else {
          setAccessMessage("You have full access.");
        }
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

      navigate("/");
    } catch (err: any) {
      setError(err.message);
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
      <motion.div
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Register</CardTitle>
          </CardHeader>
          <CardContent>
            {!isEmailVerified ? (
              <>
                <Input
                  type="email"
                  placeholder="Institutional Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button onClick={verifyEmail} className="w-full mt-4">
                  Verify Email
                </Button>
              </>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* ✅ Show Assigned Access Group */}
                <div className="p-3 bg-gray-100 rounded-md text-center">
                  <p className="font-semibold">Your access group: {accessGroup}</p>
                  <p className="text-sm text-gray-600">{accessMessage}</p>
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
                  Register
                </Button>
              </form>
            )}
            <motion.p className="text-center text-sm mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 underline">
                Login here
              </Link>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Register;
