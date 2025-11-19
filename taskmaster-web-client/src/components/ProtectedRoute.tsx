import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/authService";

/**
 * ProtectedRoute Component
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute = () => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

