import { useState, useEffect, useCallback } from "react";

export type LogEntry = {
  id: number;
  username: string;
  action: string;
  details: string;
  ip_address?: string;
  timestamp: string;
};

export function useLogs() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/logs");

      if (response.status === 403) {
        throw new Error("403 Forbidden: Access Denied");
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        setData(result);
      } else if (result.logs && Array.isArray(result.logs)) {
        setData(result.logs);
      } else {
        setData([]);
      }
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
