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

import { fetchWithAuth } from "./utils/api";

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

  const [currentRole, setCurrentRole] = useState<"student" | "instructor" | "master" | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    if (["/login", "/register"].includes(location.pathname)) {
      document.body.classList.add("disable-scroll");
    } else {
      document.body.classList.remove("disable-scroll");
    }

    return () => document.body.classList.remove("disable-scroll");
  }, [location.pathname]);

  useEffect(() => {
    if (["/login", "/register"].includes(location.pathname)) return;

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetchWithAuth("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user");

        const user = await response.json();
        console.log(user.is_master);

        if (user.is_master) {
          setCurrentRole("master");
        } else {
          setCurrentRole(user.is_student ? "student" : "instructor");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate, location.pathname]);

  // Handle login/register routes
  if (["/login", "/register"].includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NoMatch />} /> {/* Debug route */}
      </Routes>
    );
  }

  if (currentRole === null) return null;

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<Layout currentRole={currentRole} />}>
          {/* Default dashboard based on user role */}
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

          {/* Master Routes - Multiple path options for flexibility */}
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
    </Routes>
  );
}

export default App;