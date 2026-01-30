/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";

export interface LoansDetails {
  loan_id: number;
  applicant_name: string;
  applicant_id: number;
  email: string;
  start_date: string;
  duration: number;
  amount: number;
  term: number;
  status: string;
  date_applied: string;
}

export function useLoans() {
  const [data, setData] = useState<LoansDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      const response = await fetch(`/api/loans`, {
        credentials: "include",
      });

      if (!response.ok) {
        // Handle specific error codes if needed (e.g., 403 for Access Denied)
        if (response.status === 403) throw new Error("Permission denied (403)");
        throw new Error("Failed to fetch loans");
      }

      const result = await response.json();
      setData(result);
      setError(null); // Clear any previous errors on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return { data, loading, error, refetch: fetchLoans };
}