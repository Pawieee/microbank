// lib/api/dashboardStats.ts

export interface DashboardStats {
  total_loans: number;
  approved_loans: number;
  pending_loans: number;
  settled_loans: number;
  total_applicants: number;
  total_disbursed: number;
  total_payments: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  try {
    const res = await fetch("/api/dashboard-stats", {
      method: "GET",
      credentials: "include", // Include cookies for session-based auth
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      console.error("Failed to fetch dashboard stats:", res.statusText)
      return null
    }

    const data = await res.json()
    return data as DashboardStats
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return null
  }
}
