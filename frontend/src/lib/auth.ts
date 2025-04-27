// src/lib/auth.ts

export async function login(username: string, password: string) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
  
    const data = await response.json();
    return { ok: response.ok, data };
  }
  