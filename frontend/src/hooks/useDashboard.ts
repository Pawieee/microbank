import useSWR from "swr";
import { DashboardStats } from "@/types/dashboard";

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>("/api/dashboard-stats");

  return {
    stats: data || null,
    loading: isLoading,
    error: error ? (error.message || "Failed to load dashboard") : null,
    refetch: mutate
  };
}