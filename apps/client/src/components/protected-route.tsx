import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";

export function ProtectedRoute() {
  return useAuthStore((s) => s.user) ? <Outlet /> : <Navigate to="/login" replace />;
}
