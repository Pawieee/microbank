import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/spinner";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("http://localhost:5000/api/appform", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        setLoading(false); // ✅ Authenticated
      } catch (error) {
        console.error(error);
        navigate("/", { replace: true }); // 🚪 Kick to Login page
      }
    }

    checkAuth();
  }, [navigate]);

  if (loading) {
    return <Spinner size={50} className="h-screen" color="black"/>; // Or your own spinner
  }

  return <>{children}</>;
}
