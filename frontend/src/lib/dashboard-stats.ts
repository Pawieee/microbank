// lib/api/dashboardStats.ts

export interface DashboardStats {
    totalLoans: number
    totalApprovedLoans: number
    totalPendingLoans: number
    totalSettledLoans: number
    totalOutstanding: number
    totalPaidBack: number
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
  