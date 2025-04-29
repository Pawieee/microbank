import { useEffect, useState } from "react";

export interface ApplicationsDetails {
  id: number;
  applicantName: string;
  email: string;
  startDate: string;
  duration: number;
  amount: number;
  term: number; // in months
  status: "pending" | "approved" | "completed";
  dateApplied: string;
}

export function useApplications() {
  const [data, setData] = useState<ApplicationsDetails[]>([]);
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
