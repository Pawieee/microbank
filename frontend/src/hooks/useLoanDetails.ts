// src/hooks/useLoanDetails.ts
import useSWR from "swr";
import { LoanDetails } from "@/types/loans";

export function useLoanDetails(loanId: string | undefined) {
  // Use SWR with a dynamic key. If loanId is missing, pass null to skip fetching.
  const { data, error, isLoading, mutate } = useSWR<LoanDetails>(
    loanId ? `/api/loans/${loanId}` : null
  );

  return { 
    loan: data || null, 
    loading: isLoading, 
    error: error ? error.message : null, 
    refetch: mutate 
  };
}