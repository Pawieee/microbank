import { useState, useEffect, useCallback } from "react";
import { getSystemLogs, LogEntry } from "@/lib/api/logs";

export function useLogs() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const logs = await getSystemLogs();
      setData(logs);
    } catch (err: any) {
      console.error("Failed to fetch logs:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    data,
    loading,
    error,
    refetch: fetchLogs
  };
}