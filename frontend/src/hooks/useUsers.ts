// src/hooks/useUsers.ts
import { useState } from "react";
import useSWR from "swr";
import { useAlert } from "@/context/alert-context";

// ✅ Correct imports from new structure
import { 
  createUser, 
  updateUser, 
  adminResetPassword,
  deleteUser,
} from "@/api/users";

import { 
  User, 
  CreateUserPayload,
  UpdateUserPayload
} from "@/types/users";

export function useUsers() {
  // 1. SWR Fetching
  // Key: "/api/users" -> Global fetcher handles the GET request
  // Config: Polling/Caching handled globally
  const { data, error, isLoading, mutate } = useSWR<User[]>("/api/users");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { triggerAlert } = useAlert();

  // --- ACTIONS ---

  const create = async (payload: CreateUserPayload) => {
    setIsSubmitting(true);
    try {
      await createUser(payload);
      triggerAlert({ title: "Success", description: "User created successfully", variant: "success" });
      mutate(); // ✅ Automatically refresh the list
      return true;
    } catch (err: any) {
      triggerAlert({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = async (id: number, payload: UpdateUserPayload) => {
    setIsSubmitting(true);
    try {
      await updateUser(id, payload);
      triggerAlert({ title: "Success", description: "User updated successfully", variant: "success" });
      mutate(); // ✅ Automatically refresh the list
      return true;
    } catch (err: any) {
      triggerAlert({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (id: number, pass: string) => {
    setIsSubmitting(true);
    try {
      await adminResetPassword(id, pass);
      triggerAlert({ title: "Success", description: "Password reset successfully", variant: "success" });
      return true;
    } catch (err: any) {
      triggerAlert({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to delete ${username}?`)) return false;
    try {
      await deleteUser(id);
      triggerAlert({ title: "Success", description: "User deleted", variant: "success" });
      mutate(); // ✅ Automatically refresh the list
      return true;
    } catch (err: any) {
      triggerAlert({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { 
    users: data || [], 
    loading: isLoading, 
    error: error ? (error.message || "Failed to load users") : null, 
    isSubmitting,
    refresh: mutate, // 'mutate' replaces 'fetchUsers'
    create,
    update,
    resetPassword,
    remove
  };
}