// context/PublicRoute.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/shared/spinner"; // Assuming you have this

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      // 1. Quick Check: If no role in storage, they are definitely a guest
      const role = localStorage.getItem("role");
      if (!role) {
        setIsGuest(true);
        return;
      }

      // 2. Deep Check: If they have a role, are they actually logged in?
      try {
        const res = await fetch("/api/auth/check", { method: "GET" });
        if (res.ok) {
          // They ARE logged in. Kick them to their dashboard.
          const data = await res.json();
          if (data.role === "admin") navigate("/pages/logs", { replace: true });
          else if (data.role === "teller") navigate("/pages/applications", { replace: true });
          else navigate("/pages/dashboard", { replace: true });
        } else {
          // Backend says token expired. They are a guest.
          localStorage.clear();
          setIsGuest(true);
        }
      } catch (error) {
        // Network error/Backend down? Treat as guest so they can see login UI.
        setIsGuest(true);
      }
    };

    checkSession();
  }, [navigate]);

  // While checking, show nothing (or a spinner) to prevent flashing the login form
  if (!isGuest) return <div className="h-screen w-full flex items-center justify-center bg-white"><Spinner /></div>;

  return <>{children}</>;
}