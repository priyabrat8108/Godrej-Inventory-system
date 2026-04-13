import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuditProvider } from "@/context/AuditContext";

import Login from "./pages/Login";
import Inventory from "./pages/Inventory";
import Attendance from "./pages/Attendance";
import WorkAssignment from "./pages/WorkAssignment";
import ManagerPanel from "./pages/ManagerPanel";
import HighAuthority from "./pages/HighAuthority";
import ProfileSettings from "./pages/ProfileSettings";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

/* ============================= */
/* 🔐 PROTECTED ROUTE COMPONENT */
/* ============================= */

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/inventory" replace />;
  }

  return <>{children}</>;
}

/* ============================= */
/* 📌 ROUTES */
/* ============================= */

const AppRoutes = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/"
        element={
          isLoggedIn ? <Navigate to="/inventory" replace /> : <Login />
        }
      />

      {/* INVENTORY */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />

      {/* ATTENDANCE */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute roles={["Admin", "Manager", "High Authority"]}>
            <Attendance />
          </ProtectedRoute>
        }
      />

      {/* WORK ASSIGNMENT */}
      <Route
        path="/work-assignment"
        element={
          <ProtectedRoute>
            <WorkAssignment />
          </ProtectedRoute>
        }
      />

      {/* MANAGER PANEL */}
      <Route
        path="/manager-panel"
        element={
          <ProtectedRoute roles={["Manager"]}>
            <ManagerPanel />
          </ProtectedRoute>
        }
      />

      {/* HIGH AUTHORITY */}
      <Route
        path="/high-authority"
        element={
          <ProtectedRoute roles={["High Authority"]}>
            <HighAuthority />
          </ProtectedRoute>
        }
      />

      {/* PROFILE SETTINGS */}
      <Route
        path="/profile-settings"
        element={
          <ProtectedRoute roles={["Admin", "High Authority"]}>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />

      {/* AUDIT LOGS */}
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={["High Authority"]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/* ============================= */
/* 🚀 MAIN APP */
/* ============================= */

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />

    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AuditProvider>
            <AppRoutes />
          </AuditProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;