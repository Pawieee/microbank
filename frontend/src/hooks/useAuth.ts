// src/hooks/useAuth.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, logoutUser, changePassword } from "@/lib/api/auth";
import { useAlert } from "@/context/alert-context";

export function useAuth() {
  const navigate = useNavigate();
  const { triggerAlert, closeAlert } = useAlert();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError("");
    closeAlert();

    try {
      const data = await loginUser(username, password);

      localStorage.setItem("full_name", data.full_name);
      localStorage.setItem("role", data.role);
      // Save this flag so the Modal knows to appear
      localStorage.setItem("is_first_login", String(data.is_first_login));

      setTimeout(() => {
        if (data.role === 'admin') navigate("/pages/users");
        else if (data.role === 'teller') navigate("/pages/applications");
        else if (data.role === 'manager') navigate("/pages/dashboard");
        else {
          localStorage.removeItem("role");
          setError("Configuration Error");
        }
      }, 500);

    } catch (err: any) {
      const message = err.message || "Connection failed";
      setError(message);
      triggerAlert({ title: "Access Denied", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  // --- NEW: Change Password Action ---
  const changeInitialPassword = async (newPassword: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      await changePassword(newPassword);
      
      // Update local storage so the modal disappears immediately
      localStorage.setItem("is_first_login", "false");
      
      triggerAlert({ 
        title: "Success", 
        description: "Password updated successfully.", 
        variant: "success" // or "success" depending on your alert component
      });
      
      return true; // Return success status to component
    } catch (err: any) {
      const message = err.message || "Failed to update password";
      setError(message);
      triggerAlert({ title: "Update Failed", description: message, variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    login, 
    logout,
    changeInitialPassword,
    isLoading, 
    error 
  };
}