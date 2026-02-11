import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/shared/spinner";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // ✅ FIX: Use 'isLoading' instead of 'loading'
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthProvider to finish checking the session
  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>;
  }

  // 2. If no user, kick them out (save their location to redirect back later)
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. If user exists, let them in
  return <>{children}</>;
}