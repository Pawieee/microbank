/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";

export interface ApplicationsDetails {
  loan_id: number;
  applicant_name: string;
  applicant_id: number;
  email: string;
  start_date: string;
  duration: number;
  amount: number;
  term: number; // in months
  status: string;
  date_applied: string;
}

export function useApplications() {
  const [data, setData] = useState<ApplicationsDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/applications`, {
        credentials: "include",
        signal,
      });
      if (!response.ok) throw new Error("Failed to fetch loans");
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchApplications(controller.signal);
    return () => controller.abort();
  }, [fetchApplications]);

  return { data, loading, error, refetch: fetchApplications };
}
