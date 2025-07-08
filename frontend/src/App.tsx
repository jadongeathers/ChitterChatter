import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Helper & Layout Components
import Layout from "@/components/common/Layout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import DashboardRedirector from "@/components/common/DashboardRedirector";

// Page Imports
import StudentDashboard from "@/pages/student/Dashboard";
import Practice from "@/pages/student/Practice";
import VoiceChat from "@/components/student/VoiceChat/VoiceChat";
import InstructorDashboard from "@/pages/instructor/Dashboard";
import MasterDashboard from "@/pages/master/Dashboard";
import Login from "@/pages/common/Login";
import Register from "@/pages/common/Register";
import Feedback from "@/pages/student/Feedback";
import Progress from "@/pages/student/Progress";
import Settings from "@/pages/student/Settings";
import ReviewCase from "@/pages/instructor/ReviewCase";
import Lessons from "@/pages/instructor/Lessons";
import Students from "@/pages/instructor/Students";
import Analytics from "./pages/instructor/Analytics";
import ConversationDetailPage from "./pages/student/ConversationDetail";
import FeedbackHelp from "./pages/student/FeedbackHelp";
import InstructorFeedbackHelp from "./pages/instructor/FeedbackHelp";
import InstructorSettings from "./pages/instructor/Settings";
import ClassesPage from "@/pages/master/ClassesPage";
import LandingPage from "@/pages/common/LandingPage";
import ResearchTeam from "@/pages/common/ResearchTeam";

// Context Providers
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClassProvider } from "@/contexts/ClassContext";
import { StudentClassProvider } from "@/contexts/StudentClassContext";

// Define a type for user roles for clarity
type UserRole = "student" | "instructor" | "master";

// A simple 404 Not Found component
const NoMatch = () => {
  const location = useLocation();
  return (
    <div style={{ padding: "20px", textAlign: "center", marginTop: "50px" }}>
      <h2>404 - Page Not Found</h2>
      <p>No route matched the path: <strong>{location.pathname}</strong></p>
    </div>
  );
};

// The main routing logic component, now much cleaner
const AppRoutes = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  // This effect to manage body scroll on specific pages is fine.
  useEffect(() => {
    const scrollDisabledPaths = ["/login", "/register"];
    if (scrollDisabledPaths.includes(location.pathname)) {
      document.body.classList.add("disable-scroll");
    } else {
      document.body.classList.remove("disable-scroll");
    }
  }, [location.pathname]);

  // Wait for the AuthContext to finish its initial check before rendering any routes.
  if (isLoading) {
    return null; // Or a global loading spinner
  }

  return (
    <Routes>
      {/* ==================================================================== */}
      {/* 1. PUBLIC ROUTES - Accessible to everyone, logged in or not.        */}
      {/* ==================================================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/research-team" element={<ResearchTeam />} />

      {/* The root path '/' has special logic:
          - If authenticated, redirect to the user's specific dashboard.
          - If not authenticated, show the public landing page.
      */}
      <Route path="/" element={isAuthenticated ? <DashboardRedirector /> : <LandingPage />} />

      {/* ==================================================================== */}
      {/* 2. PROTECTED ROUTES - Only accessible to authenticated users.        */}
      {/* All protected routes are wrapped in the shared <Layout /> component. */}
      {/* ==================================================================== */}
      <Route element={<Layout />}>

        {/* --- STUDENT ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/practice" element={<Practice />} />
          <Route path="/student/progress" element={<Progress />} />
          <Route path="/student/settings" element={<Settings />} />
          <Route path="/student/conversations/:id" element={<ConversationDetailPage />} />
          <Route path="/student/feedback-help" element={<FeedbackHelp />} />
        </Route>

        {/* --- INSTRUCTOR ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["instructor"]} />}>
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/lessons" element={<Lessons />} />
          <Route path="/instructor/review/:caseId" element={<ReviewCase />} />
          <Route path="/instructor/review/new" element={<ReviewCase isNew />} />
          <Route path="/instructor/students" element={<Students />} />
          <Route path="/instructor/analytics" element={<Analytics />} />
          <Route path="/instructor/settings" element={<InstructorSettings />} />
          <Route path="/instructor/feedback-help" element={<InstructorFeedbackHelp />} />
        </Route>

        {/* --- MASTER ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["master"]} />}>
          <Route path="/master/dashboard" element={<MasterDashboard />} />
          <Route path="/master/classes" element={<ClassesPage />} />
        </Route>

        {/* --- SHARED PROTECTED ROUTES (Accessible by Student & Instructor) --- */}
        <Route element={<ProtectedRoute allowedRoles={["student", "instructor"]} />}>
          <Route path="/practice/:id" element={<VoiceChat />} />
          <Route path="/feedback/:id" element={<Feedback />} />
        </Route>

      </Route> {/* End of the main Layout wrapper for protected routes */}

      {/* ==================================================================== */}
      {/* 3. CATCH-ALL ROUTE - Renders if no other route matches.             */}
      {/* ==================================================================== */}
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
};

// Main App component that provides context to all routes.
// The providers no longer require props to be passed down.
export default function App() {
  return (
    <AuthProvider>
      <ClassProvider>
        <StudentClassProvider>
          <AppRoutes />
        </StudentClassProvider>
      </ClassProvider>
    </AuthProvider>
  );
}