/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { getLoanById } from "@/lib/loan";

export interface LoanDetails {
  loan_id: number;
  applicant_name: string;
  applicant_id: number;
  start_date: string;
  duration: number;
  amount: number;
  principal: number;
  interest_rate: number;
  payment_schedule: string;
  phone_number: string;
  employment_status: string;
  credit_score: string;
  next_due: string;
  status: string;
  email: string;
  date_applied: string;
  due_amount: string;
}

export function useLoanDetails(loan_id: number) {
  const [data, setData] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        const loanData = await getLoanById(String(loan_id));
        setData(loanData);
      } catch (err: any) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [loan_id, refreshKey]);

  const refresh = () => setRefreshKey((prev) => prev + 1);

  return { data, loading, error, refresh };
}
