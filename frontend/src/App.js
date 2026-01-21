import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import Landing from "./pages/Landing";
import PlannerAuth from "./pages/PlannerAuth";
import VendorAuth from "./pages/VendorAuth";
import AdminAuth from "./pages/AdminAuth";
import PlannerDashboard from "./pages/PlannerDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/planner-auth" element={<PlannerAuth />} />
      <Route path="/vendor-auth" element={<VendorAuth />} />
      <Route path="/admin-auth" element={<AdminAuth />} />
      
      <Route
        path="/planner-dashboard"
        element={
          <ProtectedRoute allowedRole="planner">
            <PlannerDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/vendor-dashboard"
        element={
          <ProtectedRoute allowedRole="vendor">
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
