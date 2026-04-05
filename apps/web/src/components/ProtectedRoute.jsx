import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLoadingScreen from "./AppLoadingScreen";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoadingScreen title="Checking your session" message="Restoring your account, workspace, and the right next screen." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
