import { useState, useEffect, useCallback } from "react";

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: "admin" | "manager" | "teller";
  status: "active" | "suspended" | "locked";
  last_login: string | null;
  created_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      
      if (!res.ok) {
         if (res.status === 403) throw new Error("403 Forbidden");
         throw new Error("Failed to fetch users");
      }
      
      const data = await res.json();
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

  return { users, loading, error, refresh: fetchUsers };
}