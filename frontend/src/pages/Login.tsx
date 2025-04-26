import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (username: string, password: string) => {
    setError("");

    try {
      const { ok, data } = await login(username, password);

      if (ok && data.success) {
        navigate("/pages/dashboard");
      } else {
        setError(data.message || "Invalid username or password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onLogin={handleLogin} />
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
