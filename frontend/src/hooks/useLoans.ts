// src/hooks/useLoans.ts
import useSWR from "swr";
import { Loan } from "@/types/loans";

export function useLoans() {
  const { data, error, isLoading, mutate } = useSWR<Loan[]>("/api/loans");

  return {
    data: data || [], 
    loading: isLoading,
    error: error ? (error.message || "Failed to load loans") : null,
    refetch: mutate 
  };
}