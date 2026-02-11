// src/hooks/useLoanPayments.ts
import useSWR from "swr";
// ✅ Import types from the new structure
import { PaymentHistoryResponse } from "@/types/payments";

export function useLoanPayments(loanId: number) {
  // 1. Use SWR
  // If loanId is 0 or missing, pass null to skip fetching
  const { data, error, isLoading, mutate } = useSWR<PaymentHistoryResponse>(
    loanId ? `/api/payments/${loanId}` : null
  );

  return { 
    // Fallback to empty structure if loading
    payments: data?.payments || [],
    totalPaid: data?.total_paid || 0,
    
    // Explicit loading state
    loading: isLoading,
    
    // Simple error string
    error: error ? (error.message || "Failed to load payments") : null,
    
    // 'mutate' allows manual refresh after a new payment is made
    refreshPayments: mutate 
  };
}