import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "@/context/LoadingContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();
  
  // Local state to track if we are actually allowed to show the content
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      try {
        // Added "/" at the start to ensure absolute path
        const res = await fetch("/api/appform", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        // If we reach here, the session is valid
        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        
        // Security: Clear any stale data from storage if the session is dead
        localStorage.clear();
        
        // Redirect to login page
        navigate("/", { replace: true });
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [navigate, setIsLoading]);

  // CRITICAL FIX:
  // Do not render {children} until we have confirmed authorization.
  // Returning null here prevents the "flash" of protected content.
  if (!isAuthorized) {
    return null; 
  }

  return <>{children}</>;
}