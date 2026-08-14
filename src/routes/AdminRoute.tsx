import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../utils/permissions";

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { userProfile } = useAuth();

  if (!isAdmin(userProfile)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;