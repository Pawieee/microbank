import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "@/context/LoadingContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      try {
        const res = await fetch("api/appform", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        navigate("/", { replace: true });
      }
    }

    checkAuth();
  }, [navigate, setIsLoading]);

  return <>{children}</>;
}
