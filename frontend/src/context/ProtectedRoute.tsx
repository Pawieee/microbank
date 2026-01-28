import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoading } from "@/context/LoadingContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation(); // To track where they were trying to go
  const { setIsLoading } = useLoading();
  
  // Local state to block rendering until confirmed
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Define the check function inside effect to avoid dependency issues
    const verifySession = async () => {
      // Only show global loading on the first check to prevent flashing
      setIsLoading(true);

      try {
        // FIX: Ping the NEUTRAL endpoint, not the restricted appform
        const res = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include", // Important: sends the cookie
        });

        if (!res.ok) {
          throw new Error("Session invalid or expired");
        }

        // Optional: Extra security - verify role matches local storage
        const data = await res.json();
        const storedRole = localStorage.getItem("role");
        
        if (data.role !== storedRole) {
           // If backend says you are 'teller' but localstorage says 'admin', force logout
           console.warn("Role mismatch detected. Forcing logout.");
           throw new Error("Role mismatch");
        }

        // If we reach here, you are officially logged in
        setIsAuthorized(true);

      } catch (error) {
        console.error("Auth Check Failed:", error);
        
        // Clear stale data
        localStorage.clear();
        
        // Redirect to login, but remember where they wanted to go (optional)
        navigate("/", { replace: true, state: { from: location } });
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [navigate, setIsLoading, location]);

  // CRITICAL: Return null while checking. 
  // This prevents the "Flash of Unstyled Content" or "Flash of Forbidden Content"
  if (!isAuthorized) {
    return null; 
  }

  // Once authorized, render the page
  return <>{children}</>;
}