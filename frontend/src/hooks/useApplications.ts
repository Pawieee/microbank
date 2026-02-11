// src/hooks/useApplications.ts
import useSWR from "swr";
import { Application } from "@/types/applications";

export function useApplications() {
  // 1. Use SWR
  // Key: "/api/applications" -> The global fetcher will use this to call your backend
  // Config: Inherits refreshInterval (3s) from the global SWRConfig in App.tsx
  const { data, error, isLoading, mutate } = useSWR<Application[]>("/api/applications");

  return {
    // Return empty array while loading to prevent UI crashes
    data: data || [], 
    
    // Explicit loading state
    loading: isLoading,
    
    // Simple error string
    error: error ? (error.message || "Failed to load data") : null,
    
    // 'mutate' triggers a re-validation (manual refetch)
    refetch: mutate 
  };
}