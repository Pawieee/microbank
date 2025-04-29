// hooks/use-loan.ts
import { useState, useEffect } from "react";
import { getLoanById } from "@/lib/loan";

export interface LoanDetailsProps {
  id: string;
  applicantName: string;
  applicant_id: number;
  startDate: string;
  duration: string;
  amount: number;
  status: string;
  email: string;
  dateApplied: string;
  dueAmount: string;
}

export const useLoan = (id: string) => {
  const [data, setData] = useState<LoanDetailsProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const loanData = await getLoanById(id);
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
  }, [id]);

  return { data, loading, error };
};
