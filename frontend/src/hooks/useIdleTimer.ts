import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// ✅ 1. Import SWR Config to manipulate the cache
import { useSWRConfig } from "swr"; 
import { logoutUser } from "@/api/auth";

// Default timeout: 15 minutes (in milliseconds)
const IDLE_TIMEOUT = 15 * 60 * 1000; 

export function useIdleTimer() {
  const navigate = useNavigate();
  // ✅ 2. Get the mutate function
  const { mutate } = useSWRConfig(); 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to handle logout
    const handleLogout = async () => {
      try {
        // Step A: Kill the session on the server
        await logoutUser();
        
        // Step B: ✅ CRITICAL FIX
        // We must tell the frontend that the user is now logged out.
        // We mutate the specific key used in AuthProvider to false.
        // 'false' as the 3rd arg prevents revalidation (we know it's dead).
        await mutate("/api/auth/check", { success: false }, false);
        
      } catch (e) {
        console.error("Logout failed", e);
      }

      // Step C: Clear legacy storage
      localStorage.removeItem("role");
      localStorage.removeItem("full_name");

      // Step D: Redirect with the reason
      // We do this LAST so the AuthProvider has already updated state
      navigate("/login?reason=timeout"); 
    };

    // Reset the timer on any user activity
    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [navigate, mutate]); // ✅ Add mutate to dependency array
}