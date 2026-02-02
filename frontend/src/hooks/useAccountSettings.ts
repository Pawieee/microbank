// src/hooks/useAccountSettings.ts
import { useState, useEffect } from "react";
import { 
  getProfile,          // Renamed from getUserProfile
  updateProfile,       // Renamed from updateUserProfile
  changeMyPassword,    // Renamed from changeUserPassword
  User                 // Renamed from UserProfile
} from "@/lib/api/users";
import { useAlert } from "@/context/alert-context";

export function useAccountSettings() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { triggerAlert } = useAlert();

  // Load Profile on Mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error(error);
        triggerAlert({ 
          title: "Error", 
          description: "Could not load profile data.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Update Name Action
  const updateName = async (fullName: string) => {
    setSubmitting(true);
    try {
      await updateProfile({ full_name: fullName });
      
      // Update local state
      if (profile) setProfile({ ...profile, full_name: fullName });
      localStorage.setItem("full_name", fullName);
      
      triggerAlert({ 
        title: "Success", 
        description: "Profile updated successfully. Refreshing...", 
        variant: "success" 
      });

      // Reload to update global layout/sidebar
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
      return true; // Return true to signal success (to clear form)
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
    profile,
    loading,
    submitting,
    updateName,
    updatePassword
  };
}