import React, { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

// The LayoutProps interface is removed as this component no longer accepts props.
// It gets everything it needs from the useAuth() context hook.

const Layout: React.FC = () => {
  // Get all user data and functionality from the central AuthContext.
  const { role, user, refetchUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Local state for the feedback dialog is fine, as it's specific to this component.
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean | null>(null);

  // This logic to hide UI elements on certain pages is correct.
  const hideSidebar = location.pathname === "/login" || location.pathname === "/register";
  const hideFeedbackButton = location.pathname === "/feedback-help";

  // This blocking check is REMOVED. It was the cause of the blank screen issue.
  // The ProtectedRoute component now handles redirects for unauthenticated users.
  // if (!user || !role) {
  //   return null;
  // }

  const handleProfilePictureChange = async (newPicture: string) => {
    try {
      await fetchWithAuth("/api/auth/update-profile-picture", {
        method: "POST",
        body: JSON.stringify({ profile_picture: newPicture }),
      });
      // After updating, tell the AuthContext to refetch the user data globally.
      if (refetchUser) {
        await refetchUser();
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    setFeedbackSuccess(null);
    try {
      await fetchWithAuth("/api/system/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setFeedbackSuccess(true);
      setFeedback("");
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

  const handleGoToHelpPage = () => {
    navigate("/feedback-help");
    setFeedbackOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Conditionally render sidebar only if the role is available */}
        {role && !hideSidebar && (
          <UpdatedSidebar 
            className="w-64 shrink-0 z-40" 
          />
        )}

        <div className="flex flex-col flex-1">
          {/* Conditionally render header only if all user data is available */}
          {user && role && (
            <Header 
              currentRole={role} 
              userName={`${user.first_name} ${user.last_name}`}
              profilePicture={user.profile_picture_url || `/images/profile-icons/${user.profile_picture || 'blueberry.png'}`}
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
                    You may also contact us directly via email at jag569@cornell.edu.
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