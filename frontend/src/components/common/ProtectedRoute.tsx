import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Define a type for user roles to be used within this component
type UserRole = "student" | "instructor" | "master";

// Define the props that this component will accept
interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { role: userRole, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. While AuthContext is figuring out the user's status, render nothing.
  // This prevents the page from flickering or showing content prematurely.
  if (isLoading) {
    return null; 
  }

  // 2. If the user is definitively not authenticated, redirect to the login page.
  // We pass the user's intended destination (`location`) in the state.
  // After a successful login, you can redirect them back to this location.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the user is authenticated, check their role.
  // If their role is NOT in the list of allowed roles for this route, redirect them.
  if (userRole && !allowedRoles.includes(userRole)) {
    // A user-friendly approach is to send them to their own dashboard
    // instead of a harsh "Access Denied" page.
    const defaultDashboardPath = `/${userRole}/dashboard`;
    return <Navigate to={defaultDashboardPath} replace />;
  }

  // 4. If all checks pass, render the child component.
  // The <Outlet /> is a placeholder provided by react-router-dom
  // that renders the matched nested route.
  return <Outlet />;
};

export default ProtectedRoute;