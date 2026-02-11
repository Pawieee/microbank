// src/types/auth.ts

export interface User {
  username: string;
  role: string;
  fullName: string;
  isFirstLogin: boolean;
}

export interface AuthResponse {
  success: boolean;
  username?: string;
  role?: string;
  full_name?: string;
  is_first_login?: boolean;
  message?: string;
}