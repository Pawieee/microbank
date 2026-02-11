// src/hooks/useAuth.ts
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/auth-provider";
import { useAlert } from "@/context/alert-context";
import { changePassword } from "@/api/auth";

export function useAuth() {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const { triggerAlert, closeAlert } = useAlert();

  const [error, setError] = useState<string | null>(null);
  const [lockoutUntil, setLockoutUntil] = useState<string | null>(null);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, login: contextLogin, logout: contextLogout, loading } = context;

  const login = async (u: string, p: string) => {
    // 1. Reset states at the start of a new attempt
    setError(null);
    setLockoutUntil(null); 
    closeAlert();

    try {
      const loggedInUser = await contextLogin(u, p);

      // 2. Navigate based on role
      if (loggedInUser.role === 'admin') navigate("/pages/users");
      else if (loggedInUser.role === 'teller') navigate("/pages/applications");
      else navigate("/pages/dashboard");

    } catch (err: any) {
      // 3. Handle Errors
      
      // ✅ LOCKOUT CASE:
      // We only set the timestamp. We DO NOT set a generic 'error' string.
      // This ensures that when the timer expires, the UI is completely clear.
      if (err.lockoutUntil) {
        setLockoutUntil(err.lockoutUntil);
        setError(null); 
      } 
      // ❌ STANDARD ERROR CASE (Wrong password, Suspended, etc.):
      else {
        const msg = err.message || "Login failed";
        setError(msg);
        triggerAlert({ 
          title: "Access Denied", 
          description: msg, 
          variant: "destructive" 
        });
      }
    }
  };

  const logout = async () => {
    closeAlert();
    await contextLogout();
    navigate("/");
  };

  const changeInitialPassword = async (newPassword: string) => {
    try {
      await changePassword(newPassword);
      
      // Update local state to reflect first login is done
      if (user) user.isFirstLogin = false;

      triggerAlert({ 
        title: "Success", 
        description: "Password updated.", 
        variant: "default" 
      });
      return true;
    } catch (err: any) {
      triggerAlert({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    user,
    isLoading: loading,
    error,
    lockoutUntil, // ✅ Expose to Login Page for the timer
    login,
    logout,
    changeInitialPassword,

    isAuthenticated: !!user,
    isManager: user?.role === "manager",
    isTeller: user?.role === "teller",
    isAdmin: user?.role === "admin",
  };
}