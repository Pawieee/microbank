// src/hooks/useAccountSettings.ts
import { useState } from "react";
import useSWR from "swr";
import { User } from "@/types/users";
import { updateProfile, changeMyPassword } from "../api/users";
import { useAlert } from "@/context/alert-context";

export function useAccountSettings() {
  // 1. SWR Fetching
  const { data: profile, isLoading, mutate } = useSWR<User>("/api/me");
  
  const [submitting, setSubmitting] = useState(false);
  const { triggerAlert } = useAlert();

  // Update Name Action
  const updateName = async (fullName: string) => {
    setSubmitting(true);
    try {
      await updateProfile({ full_name: fullName });
      
      // OPTIMISTIC UI: Update the local cache immediately
      if (profile) {
        mutate({ ...profile, full_name: fullName }, false); 
      }
      
      localStorage.setItem("full_name", fullName); // Legacy support if needed
      
      triggerAlert({ 
        title: "Success", 
        description: "Profile updated successfully.", 
        variant: "success" 
      });

      // Reload only if strictly necessary for other components
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      triggerAlert({ 
        title: "Update Failed", 
        description: "Could not update profile information.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Change Password Action
  const updatePassword = async (current: string, newPass: string) => {
    setSubmitting(true);
    try {
      await changeMyPassword({ 
        current_password: current, 
        new_password: newPass 
      });

      triggerAlert({ 
        title: "Security Update", 
        description: "Password changed successfully.", 
        variant: "success" 
      });
      return true; 
    } catch (err: any) {
      triggerAlert({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    profile: profile || null,
    loading: isLoading,
    submitting,
    updateName,
    updatePassword
  };
}