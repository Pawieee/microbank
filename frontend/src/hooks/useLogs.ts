import { useState, useEffect } from "react";

// Define the shape of a single log entry
export type LogEntry = {
  id: number;
  username: string; // The user who performed the action
  action: string;   // e.g., "LOGIN", "DISBURSEMENT"
  details: string;  // e.g., "Approved loan #123"
  ip_address?: string;
  timestamp: string;
};

export function useLogs() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/logs");

        // Handle specific HTTP errors
        if (response.status === 403) {
          throw new Error("403 Forbidden: Access Denied");
        }
        
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Ensure result is an array before setting it
        if (Array.isArray(result)) {
            setData(result);
        } else if (result.logs && Array.isArray(result.logs)) {
             // Handle case where backend returns { logs: [...] }
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
    };

    fetchLogs();
  }, []);

  return { data, loading, error };
}