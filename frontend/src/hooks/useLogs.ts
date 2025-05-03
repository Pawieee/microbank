/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

export type Log = {
  id: string;
  action: string;
  performed_by: string;
  target_type: string;
  target_id: string | number;
  details: string;
  date_time: string;
  status: "success" | "failed";
};

export function useLogs() {
  const [data, setData] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/logs`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch logs");
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return { data, loading, error };
}
