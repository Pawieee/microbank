/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await fetch(`/api/loans`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch loans");
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  return { data, loading, error };
}
