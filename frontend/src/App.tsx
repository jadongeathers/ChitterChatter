// App.tsx  (or wherever your AppRoutes lives)
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
import ClassesPage from "@/pages/master/ClassesPage";
import UsersPage from "@/pages/master/UsersPage";

// Context Providers
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClassProvider } from "@/contexts/ClassContext";
import { StudentClassProvider } from "@/contexts/StudentClassContext";

// Public pages
import LandingPage from "@/pages/common/LandingPage";
import ResearchTeam from "@/pages/common/ResearchTeam";

type UserRole = "student" | "instructor" | "master";

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

const AppRoutes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authIsLoading, role: authRole } = useAuth();

  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ───────────────────────────────────────────────────────────────────────────
  // 1) First, banish scroll on /login and /register
  useEffect(() => {
    if (["/login", "/register"].includes(location.pathname)) {
      document.body.classList.add("disable-scroll");
    } else {
      document.body.classList.remove("disable-scroll");
    }
    return () => {
      document.body.classList.remove("disable-scroll");
    };
  }, [location.pathname]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2) Next, wait until AuthContext is done checking /api/auth/me
  //    so that we know exactly if isAuthenticated === true or false.
  useEffect(() => {
    if (authIsLoading) {
      // Still waiting for /api/auth/me
      return;
    }

    // AuthContext done. If user is logged in, set currentRole from AuthContext
    if (isAuthenticated && authRole) {
      setCurrentRole(authRole);
    } else {
      // No token or invalid → ensure role = null
      setCurrentRole(null);
    }

    setIsLoading(false);
  }, [authIsLoading, isAuthenticated, authRole]);

  // While we’re waiting for AuthContext to settle, render nothing
  if (isLoading) {
    return null;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3) Public routes (these never mount ClassProvider or StudentClassProvider)
  //    If the user is at “/” with no token → landing. 
  const token = localStorage.getItem("access_token");
  if (!token && location.pathname === "/") {
    return <LandingPage />;
  }

  //    If the user is on any of the explicitly “public” paths → just render them
  const publicRoutes = ["/login", "/register", "/research-team"];
  if (publicRoutes.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/research-team" element={<ResearchTeam />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4) At this point:
  //    • We know isAuthenticated = true OR false (AuthContext is done).
  //    • We are not on “/” (landing) and not on a public route.
  //    • If isAuthenticated=false, force a redirect to /login.
  if (!isAuthenticated) {
    navigate("/login");
    return null; // don’t render anything else
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5) Now we know for sure isAuthenticated===true.
  //    Decide which role‐based “branch” to render:
  //    – instructor
  //    – student
  //    – master
  //    (We already set currentRole from AuthContext above.)
  if (currentRole === "instructor") {
    return (
      <ClassProvider userRole={currentRole}>
        <Routes>
          {/* You can still expose “/research-team” here if you like, but it’s safe to put it above. */}
          {/* Protected Routes (the user is an instructor!) */}
          <Route path="/*" element={<ProtectedRoute />}>
            <Route element={<Layout currentRole={currentRole as UserRole} />}>
              <Route index element={<InstructorDashboard />} />

              {/* Master Routes (although an instructor probably won’t hit these) */}
              <Route path="master" element={<MasterDashboard />} />
              <Route path="master/dashboard" element={<MasterDashboard />} />
              <Route path="master/classes" element={<ClassesPage />} />
              <Route path="master/users" element={<UsersPage />} />

              {/* Instructor‐only pages */}
              <Route path="instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="instructor/lessons" element={<Lessons />} />
              <Route path="instructor/review/:caseId" element={<ReviewCase />} />
              <Route path="instructor/review/new" element={<ReviewCase isNew />} />
              <Route path="instructor/feedback/:caseId" element={<ReviewFeedback />} />
              <Route path="instructor/students" element={<Students />} />
              <Route path="instructor/analytics" element={<Analytics />} />
              <Route path="instructor/feedback-help" element={<InstructorFeedbackHelp />} />
              <Route path="instructor/settings" element={<InstructorSettings />} />

              {/* Catch‐all for anything else */}
              <Route path="*" element={<NoMatch />} />
            </Route>
          </Route>

          {/* In case you typed a random path that didn't match anything in the <ProtectedRoute> */}
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </ClassProvider>
    );
  } 
  else if (currentRole === "student") {
    return (
      <StudentClassProvider userRole={currentRole}>
        <Routes>
          {/* Protected student routes */}
          <Route path="/*" element={<ProtectedRoute />}>
            <Route element={<Layout currentRole={currentRole as UserRole} />}>
              <Route index element={<StudentDashboard />} />

              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="practice/*" element={<Practice />} />
              <Route path="progress" element={<Progress />} />
              <Route path="settings" element={<Settings />} />
              <Route path="practice/:id" element={<VoiceChat />} />
              <Route path="feedback/:id" element={<Feedback />} />
              <Route path="conversations/:id" element={<ConversationDetailPage />} />
              <Route path="feedback-help" element={<FeedbackHelp />} />

              <Route path="*" element={<NoMatch />} />
            </Route>
          </Route>

          <Route path="*" element={<NoMatch />} />
        </Routes>
      </StudentClassProvider>
    );
  } 
  else {
    // currentRole === "master"
    return (
      <Routes>
        {/* Master’s public pages (optional) */}
        <Route path="/research-team" element={<ResearchTeam />} />

        {/* Master’s protected pages */}
        <Route path="/*" element={<ProtectedRoute />}>
          <Route element={<Layout currentRole={currentRole as UserRole} />}>
            <Route index element={<MasterDashboard />} />

            <Route path="master" element={<MasterDashboard />} />
            <Route path="master/dashboard" element={<MasterDashboard />} />
            <Route path="master/classes" element={<ClassesPage />} />
            <Route path="master/users" element={<UsersPage />} />
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Route>

        <Route path="*" element={<NoMatch />} />
      </Routes>
    );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
