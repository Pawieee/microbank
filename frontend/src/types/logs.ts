// src/types/logs.ts

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
}