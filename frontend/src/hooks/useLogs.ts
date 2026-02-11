// src/hooks/useLogs.ts
import useSWR from "swr";
import { useMemo } from "react";
// ✅ Import types from new structure
import { LogEntry } from "@/types/logs";

export function useLogs() {
  // 1. Use SWR
  // Key: "/api/logs" matches the backend endpoint
  // Config: Uses global refreshInterval (3s) from App.tsx
  // We use 'any' here because the backend might return { logs: [] } or just []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, isLoading, mutate } = useSWR<any>("/api/logs");

  // 2. Normalize Data
  // Handles variations: Array vs Object wrapper
  const logs: LogEntry[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.logs && Array.isArray(data.logs)) return data.logs;
    return [];
  }, [data]);

  return {
    // Always return an array to prevent UI crashes
    data: logs,
    
    // Explicit loading state
    loading: isLoading,
    
    // Simple error string
    error: error ? (error.message || "Failed to load logs") : null,
    
    // 'mutate' triggers a re-validation (manual refetch)
    refetch: mutate
  };
}