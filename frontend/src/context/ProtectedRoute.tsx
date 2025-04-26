import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "@/context/LoadingContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true); // 🔥 Show loading
      try {
        const res = await fetch("http://localhost:5000/api/appform", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        setIsLoading(false); // ✅ Done loading
      } catch (error) {
        console.error(error);
        setIsLoading(false); // 🔥 Hide even on error
        navigate("/", { replace: true });
      }
    }

    checkAuth();
  }, [navigate, setIsLoading]);

  return <>{children}</>;
}
