// hooks/use-loan.ts
import { useState, useEffect } from "react";
import { getLoanById } from "@/lib/loan";

export interface ApplicationDetails {
  loan_id: number;
  applicant_name: string;
  applicant_id: number;
  start_date: string;
  duration: number;
  amount: number;
  status: string;
  email: string;
  date_applied: string;
  due_amount: string;
}

export const useApplication = (loan_id: number) => {
  const [data, setData] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const loanData = await getLoanById(String(loan_id));
        setData(loanData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [loan_id]);

  return { data, loading, error };
};
