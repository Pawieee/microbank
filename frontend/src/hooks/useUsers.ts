// src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from "react";
import { 
  getUsersList, 
  createUser, 
  updateUser, 
  adminResetPassword,
  deleteUser,
  User, 
  CreateUserPayload,
  UpdateUserPayload
} from "@/lib/api/users";
import { useAlert } from "@/context/alert-context";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { triggerAlert } = useAlert();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsersList();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- ACTIONS ---

  const create = async (data: CreateUserPayload) => {
    setIsSubmitting(true);
    try {
      await createUser(data);
      triggerAlert({ title: "Success", description: "User created successfully", variant: "success" });
      await fetchUsers(); // Reload list
      return true;
    } catch (err: any) {
      triggerAlert({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = async (id: number, data: UpdateUserPayload) => {
    setIsSubmitting(true);
    try {
      await updateUser(id, data);
      triggerAlert({ title: "Success", description: "User updated successfully", variant: "success" });
      await fetchUsers();
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
      await fetchUsers();
      return true;
    } catch (err: any) {
      triggerAlert({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { 
    users, 
    loading, 
    error, 
    isSubmitting,
    refresh: fetchUsers,
    create,
    update,
    resetPassword,
    remove
  };
}