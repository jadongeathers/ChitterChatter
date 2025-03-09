import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import UpdatedSidebar from "./Sidebar";
import Header from "./Header";
import { fetchWithAuth } from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, HelpCircle } from "lucide-react";

type UserRole = "student" | "instructor" | "master";

interface LayoutProps {
  currentRole: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ currentRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("Loading...");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [_userId, setUserId] = useState<number | null>(null);
  const [_isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Feedback form state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean | null>(null);

  // Hide sidebar on login/register pages
  const hideSidebar = location.pathname === "/login" || location.pathname === "/register";
  // Hide feedback button on the feedback/help page
  const hideFeedbackButton = location.pathname === "/feedback-help";

  // Try to get profile picture from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.profile_picture_url) {
          setProfilePicture(userData.profile_picture_url);
        } else if (userData.profile_picture) {
          setProfilePicture(`/images/profile-icons/${userData.profile_picture}`);
        }
        
        if (userData.first_name && userData.last_name) {
          setUserName(`${userData.first_name} ${userData.last_name}`);
        }
      } catch (e) {
        console.error("Error parsing stored user data:", e);
      }
    }
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth("/api/auth/me");

      if (!response.ok) throw new Error("Failed to fetch user");

      const data = await response.json();
      setUserId(data.id);
      
      if (data.first_name && data.last_name) {
        setUserName(`${data.first_name} ${data.last_name}`);
      } else {
        setUserName("User");
      }

      // Set profile picture if available
      if (data.profile_picture_url) {
        setProfilePicture(data.profile_picture_url);
      } else if (data.profile_picture) {
        setProfilePicture(`/images/profile-icons/${data.profile_picture}`);
      } else {
        setProfilePicture("/images/profile-icons/blueberry.png");
      }
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching user info:", error);
      setUserName("Guest");
      setProfilePicture("/images/profile-icons/blueberry.png");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data from API
  useEffect(() => {
    fetchUserData();
  }, [refreshTrigger]);

  // Handle profile picture updates
  const handleProfilePictureChange = async (newPicture: string) => {
    try {
      // Update UI immediately
      setProfilePicture(`/images/profile-icons/${newPicture}`);
      
      const response = await fetchWithAuth("/api/auth/update-profile-picture", {
        method: "POST",
        body: JSON.stringify({ profile_picture: newPicture }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile picture");
      }
      
      const data = await response.json();
      
      // Update localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          userData.profile_picture = newPicture;
          userData.profile_picture_url = `/images/profile-icons/${newPicture}`;
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (e) {
          console.error("Error updating stored user data:", e);
        }
      }
      
      // Force a refresh of user data from the server (if needed)
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Error updating profile picture:", error);
      // Revert to previous picture if there was an error
      fetchUserData();
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    setFeedbackSuccess(null);

    try {
      const response = await fetchWithAuth("/api/system/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");
      
      setFeedbackSuccess(true);
      setFeedback("");
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackSuccess(null);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedbackSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigating to full help page
  const handleGoToHelpPage = () => {
    navigate("/feedback-help");
    setFeedbackOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {!hideSidebar && (
          <UpdatedSidebar 
            currentRole={currentRole} 
            className="w-64 shrink-0 z-40" 
          />
        )}

        <div className="flex flex-col flex-1">
          {/* Only render Header when profilePicture has been determined */}
          {profilePicture && (
            <Header 
              currentRole={currentRole} 
              userName={userName} 
              profilePicture={profilePicture}
              onProfilePictureChange={handleProfilePictureChange}
            />
          )}
          <main className="flex-1 p-6 bg-background mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          
          {/* Floating Feedback Button */}
          {!hideFeedbackButton && (
            <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="fixed bottom-6 right-6 rounded-full w-12 h-12 p-0 shadow-xl bg-white text-black hover:bg-gray-100 border border-gray-400" 
                  size="icon"
                >
                    <div className="scale-125">
                      <HelpCircle />
                    </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Help & Feedback</DialogTitle>
                  <DialogDescription>
                    Share your thoughts or report an issue with the system.
                  </DialogDescription>
                </DialogHeader>
                
                {feedbackSuccess === true ? (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="bg-green-100 text-green-700 rounded-full p-3 mb-2">
                      <Check className="h-6 w-6" />
                    </div>
                    <p className="text-lg font-medium">Thanks for your feedback!</p>
                    <p className="text-gray-500">Your input helps us improve the system.</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="Describe your feedback or issue here..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-[120px]"
                      disabled={isSubmitting}
                    />
                    
                    {feedbackSuccess === false && (
                      <p className="text-sm text-red-600">
                        There was an issue submitting your feedback. Please try again.
                      </p>
                    )}
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={handleGoToHelpPage}
                        className="w-full sm:w-auto bg-blue-500 text-white hover:bg-blue-400 hover:text-white"
                      >
                        View Full Help Center
                      </Button>
                      <Button 
                        onClick={handleSubmitFeedback}
                        disabled={isSubmitting || !feedback.trim()}
                        className="w-full sm:w-auto"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;