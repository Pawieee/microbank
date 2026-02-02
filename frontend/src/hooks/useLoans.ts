// src/hooks/useLoans.ts
import { useEffect, useState, useCallback } from "react";
import { getLoansList, Loan } from "@/lib/api/loans";

export function useLoans() {
  const [data, setData] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLoansList(signal);
      setData(result);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching loans:", err);
        setError(err.message || "Failed to load loans");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchLoans(controller.signal);
    return () => controller.abort();
  }, [fetchLoans]);

  return { data, loading, error, refetch: fetchLoans };
}