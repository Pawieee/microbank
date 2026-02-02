export interface LogEntry {
  id: number;
  username: string;
  action: string;
  details: string;
  ip_address?: string;
  timestamp: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  // If backend returns pagination metadata later, it goes here
}

export async function getSystemLogs(): Promise<LogEntry[]> {
  const res = await fetch("/api/logs", { credentials: "include" });

  if (res.status === 403) {
    throw new Error("403 Forbidden: Access Denied");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch logs: ${res.statusText}`);
  }

  const result = await res.json();

  // Handle potential backend response variations (Array vs Object)
  if (Array.isArray(result)) {
    return result;
  } else if (result.logs && Array.isArray(result.logs)) {
    return result.logs;
  }
  
  return [];
}