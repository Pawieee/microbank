// src/api/users.ts
import { 
  UpdateProfilePayload, 
  ChangePasswordPayload, 
  CreateUserPayload, 
  UpdateUserPayload 
} from "@/types/users";

// ==========================================
// 1. PROFILE MUTATIONS
// ==========================================

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
// 2. ADMIN MUTATIONS
// ==========================================

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