// src/lib/api/auth.ts

export interface AuthResponse {
  success: boolean;
  username: string;
  role: string;
  full_name: string;
  is_first_login: boolean; // <--- ADD THIS LINE
  message?: string;
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch("/api/login", { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Invalid credentials");
  }

  return data;
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/logout", { 
    method: "POST", 
    credentials: "include" 
  });
}

export async function changePassword(newPassword: string) {
  const response = await fetch('/api/me/change-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ new_password: newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to change password');
  }

  return data;
}