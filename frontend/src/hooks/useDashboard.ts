export interface DailyApplicantData {
  date: string;
  applicant_count: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface DashboardStats {
  approved_loans: number;
  pending_loans: number;
  settled_loans: number;
  rejected_loans: number; // NEW
  total_disbursed: number;
  total_payments: number;
  net_revenue: number;    // NEW
  daily_applicant_data: DailyApplicantData[];
  loan_purpose_data: ChartData[]; // NEW
  demographic_data: ChartData[];  // NEW
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  try {
    const res = await fetch("/api/dashboard-stats", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data as DashboardStats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}