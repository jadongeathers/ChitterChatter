import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const DashboardRedirector = () => {
    const { role } = useAuth();

    // If the user has a role, construct the path to their dashboard.
    if (role) {
        const dashboardPath = `/${role}/dashboard`;
        return <Navigate to={dashboardPath} replace />;
    }

    // As a fallback (e.g., if role is somehow null), send to login.
    // The `replace` prop prevents this redirect from being added to the history stack.
    return <Navigate to="/login" replace />;
}

export default DashboardRedirector;