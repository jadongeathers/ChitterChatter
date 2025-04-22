import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/common/Layout";
import StudentDashboard from "@/pages/student/Dashboard";
import Practice from "@/pages/student/Practice";
import VoiceChat from "@/components/student/VoiceChat/VoiceChat";
import InstructorDashboard from "@/pages/instructor/Dashboard";
import MasterDashboard from "@/pages/master/Dashboard";
import Login from "@/pages/common/Login";
import Register from "@/pages/common/Register";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import Feedback from "@/pages/student/Feedback";
import Progress from "@/pages/student/Progress";
import Settings from "@/pages/student/Settings";
import ReviewCase from "@/pages/instructor/ReviewCase";
import ReviewFeedback from "./pages/instructor/ReviewFeedback";
import Lessons from "@/pages/instructor/Lessons";
import Students from "@/pages/instructor/Students";
import Analytics from "./pages/instructor/Analytics";
import ConversationDetailPage from "./pages/student/ConversationDetail";
import FeedbackHelp from "./pages/student/FeedbackHelp";
import InstructorFeedbackHelp from "./pages/instructor/FeedbackHelp";
import InstructorSettings from "./pages/instructor/Settings";

// New Imports for Public Pages
import LandingPage from "@/pages/common/LandingPage";
import ResearchTeam from "@/pages/common/ResearchTeam";

import { fetchWithAuth } from "./utils/api";

// Define the UserRole type to match what Layout expects
type UserRole = "student" | "instructor" | "master";

// Debug component to help find routing issues
const NoMatch = () => {
  const location = useLocation();
  return (
    <div style={{ padding: "20px", backgroundColor: "#ffdddd", margin: "20px", borderRadius: "5px" }}>
      <h2>Error: No Route Matched</h2>
      <p>Current path: <strong>{location.pathname}</strong></p>
      <p>This error occurs when React Router can't find a matching route for the current URL.</p>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Manage scroll lock for login/register pages
    if (["/login", "/register"].includes(location.pathname)) {
      document.body.classList.add("disable-scroll");
    } else {
      document.body.classList.remove("disable-scroll");
    }
    return () => {
      document.body.classList.remove("disable-scroll");
    };
  }, [location.pathname]);

  useEffect(() => {
    // Define public routes that don't require a user fetch.
    const publicRoutes = ["/login", "/register", "/research-team"];
    
    // If user is on a public route or on the landing page ("/"), skip fetching user data
    if (publicRoutes.includes(location.pathname) || location.pathname === "/") {
      setIsLoading(false);
      return;
    }
    
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setIsLoading(false);
          if (location.pathname !== "/") navigate("/login");
          return;
        }

        const response = await fetchWithAuth("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user");

        const user = await response.json();
        setCurrentRole(user.is_master ? "master" : (user.is_student ? "student" : "instructor"));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        setIsLoading(false);
        if (location.pathname !== "/") navigate("/login");
      }
    };

    fetchUser();
  }, [navigate, location.pathname]);

  if (isLoading) return null;

  // If there's no token and the user is at the root path, render the landing page.
  const token = localStorage.getItem("access_token");
  if (!token && location.pathname === "/") {
    return <LandingPage />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/research-team" element={<ResearchTeam />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route path="/*" element={<ProtectedRoute />}>
        <Route element={<Layout currentRole={currentRole as UserRole} />}>
          <Route index element={
            currentRole === "master"
              ? <MasterDashboard />
              : currentRole === "student"
                ? <StudentDashboard />
                : <InstructorDashboard />
          } />
          {/* Common Routes */}
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="practice/*" element={<Practice />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<Settings />} />
          <Route path="practice/:id" element={<VoiceChat />} />
          <Route path="feedback/:id" element={<Feedback />} />
          <Route path="conversations/:id" element={<ConversationDetailPage />} />
          <Route path="feedback-help" element={<FeedbackHelp />} />

          {/* Master Routes */}
          <Route path="master" element={<MasterDashboard />} />
          <Route path="master/dashboard" element={<MasterDashboard />} />

          {/* Instructor Routes */}
          <Route path="instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="instructor/lessons" element={<Lessons />} />
          <Route path="instructor/review/:caseId" element={<ReviewCase />} />
          <Route path="instructor/review/new" element={<ReviewCase isNew />} />
          <Route path="instructor/feedback/:caseId" element={<ReviewFeedback />} />
          <Route path="instructor/students" element={<Students />} />
          <Route path="instructor/analytics" element={<Analytics />} />
          <Route path="instructor/feedback-help" element={<InstructorFeedbackHelp />} />
          <Route path="instructor/settings" element={<InstructorSettings />} />
          {/* Debug catch-all route */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Route>

      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}

export default App;
