// src/api/auth.ts
import { AuthResponse } from "@/types/auth";

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error("Server returned non-JSON response:", error);
    throw new Error("Server error (500). Please contact support.");
  }

  if (!data.success) {
    // ✅ Attach lockout info to the error object
    const error: any = new Error(data.message || "Login failed");
    if (data.lockoutUntil) error.lockoutUntil = data.lockoutUntil;
    throw error;
  }

  return data;
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
}

export async function changePassword(newPassword: string) {
  const response = await fetch('/api/me/change-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ new_password: newPassword }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to change password');
  return data;
}