import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/shared/spinner";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  // ✅ FIX: Use 'isLoading' instead of 'loading'
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>;
  }

  // If user is ALREADY logged in, redirect them away from Login page
  if (user) {
    if (user.role === 'admin') return <Navigate to="/pages/users" replace />;
    if (user.role === 'teller') return <Navigate to="/pages/applications" replace />;
    return <Navigate to="/pages/dashboard" replace />;
  }

  // If guest, show the Login page
  return <>{children}</>;
}