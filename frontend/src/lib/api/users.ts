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

// Payloads
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

// ==========================================
// 2. CURRENT USER (Profile / "Me")
// ==========================================

export async function getProfile(): Promise<User> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const res = await fetch("/api/me/update-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function changeMyPassword(payload: ChangePasswordPayload) {
  const res = await fetch("/api/me/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change password");
  return data;
}

// ==========================================
// 3. ADMIN MANAGEMENT (CRUD)
// ==========================================

export async function getUsersList(): Promise<User[]> {
  const res = await fetch("/api/users", { credentials: "include" });
  
  if (res.status === 403) throw new Error("403 Forbidden");
  if (!res.ok) throw new Error("Failed to fetch users");
  
  return res.json();
}

export async function createUser(payload: CreateUserPayload) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Create failed");
  return data;
}

export async function updateUser(userId: number, payload: UpdateUserPayload) {
  const res = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Update failed");
  return data;
}

export async function adminResetPassword(userId: number, password: string) {
  const res = await fetch(`/api/users/${userId}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Reset failed");
  return data;
}

export async function deleteUser(userId: number) {
  const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
}