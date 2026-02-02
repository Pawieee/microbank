/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { getLoanDetails, LoanDetails } from "@/lib/api/loans"; // 1. Import from API Layer

export function useLoanDetails(loanId: string | undefined) {
  // 2. Use the correct type (LoanDetails includes 'remarks' and specifics not in the List view)
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoanDetails = useCallback(async () => {
    if (!loanId) return;
    
    setLoading(true);
    setError(null);
    try {
      // 3. Use the centralized fetch function we created earlier
      const result = await getLoanDetails(loanId);
      setLoan(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  return { loan, loading, error, refetch: fetchLoanDetails };
}