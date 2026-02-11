// src/types/users.ts

// ==========================================
// 1. SHARED TYPES
// ==========================================

export interface User {
  user_id: number;
  full_name: string;
  username: string;
  role: "admin" | "manager" | "teller";
  status?: "active" | "suspended" | "locked";
  last_login?: string | null;
  created_at: string;
}

// ==========================================
// 2. PAYLOADS
// ==========================================

export interface UpdateProfilePayload {
  full_name: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface CreateUserPayload {
  full_name: string;
  username: string;
  password?: string;
  role: string;
  status: string;
}

export interface UpdateUserPayload {
  full_name?: string;
  role?: string;
  status?: string;
}