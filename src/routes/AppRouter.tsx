import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailsPage from "../pages/OrderDetailsPage";
import HistoryPage from "../pages/HistoryPage";
import AdminRoute from "./AdminRoute";
import EditOrderPage from "../pages/EditOrderPage";
import DashboardPage from "../pages/DashboardPage";

function AppRouter() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      {/* LOGIN */}

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* AUTHENTICATED APPLICATION */}

      <Route
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        }
      >
        {/* DASHBOARD */}

        <Route path="/" element={<DashboardPage />} />

        {/* ORDERS */}

        <Route path="/orders" element={<OrdersPage />} />

        <Route path="/orders/:orderNumber" element={<OrderDetailsPage />} />

        <Route path="/orders/:orderNumber/edit" element={<EditOrderPage />} />

        {/* HISTORY */}

        <Route path="/history" element={<HistoryPage />} />

        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* UNKNOWN ROUTES */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
