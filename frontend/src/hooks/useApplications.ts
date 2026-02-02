// src/hooks/useApplications.ts
import { useEffect, useState, useCallback } from "react";
import { getApplicationsList, Application } from "@/lib/api/applications";

export function useApplications() {
  const [data, setData] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getApplicationsList(signal);
      setData(result);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error loading applications:", err);
        setError(err.message || "Failed to load data");
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