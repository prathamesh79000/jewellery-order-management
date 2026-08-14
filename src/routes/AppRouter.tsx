import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

import LoginPage from "../pages/LoginPage";
import AppLayout from "../layouts/AppLayout";
import AdminRoute from "./AdminRoute";
import AdminPage from "../pages/AdminPage";

function AppRouter() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/*"
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default AppRouter;
