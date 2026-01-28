import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCards } from "@/components/section-cards";
import { fetchDashboardStats, DashboardStats } from "@/lib/dashboard-stats";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Button } from "./ui/button";

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Role Check (Client Side)
    const role = localStorage.getItem("role");

    // Tellers cannot view Dashboard
    if (role === "teller" || role === "admin") {
      setIsForbidden(true);
      setLoading(false);
      return; 
    }

    // 2. Fetch Data
    const fetchData = async () => {
      try {
        const data = await fetchDashboardStats();
        
        // If API returns null (Backend 403), show restricted UI
        if (!data) {
            setIsForbidden(true);
        } else {
            setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setIsForbidden(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading dashboard data...</div>;
  }

  // 3. UNIFORM RESTRICTED UI
  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 bg-red-100 rounded-full text-red-600 dark:bg-red-900/20">
            {/* Lock Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 10m0 0a2 2 0 0 1 2 2a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2a2 2 0 0 1 2 -2"/><path d="M12 14v2"/><path d="M12 8v.01"/></svg>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Restricted Access</h2>
            <p className="text-muted-foreground max-w-[400px]">
              You do not have permission to view this page.
            </p>
        </div>

        <div className="mt-2">
            <Button 
                variant="default"
                onClick={() => navigate(-1)} 
            >
                Go back
            </Button>
        </div>
      </div>
    );
  }

  const {
    approved_loans,
    pending_loans,
    settled_loans,
    total_disbursed,
    total_payments,
    daily_applicant_data,
  } = stats || {};

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6">
        <SectionCards
          approved_loans={approved_loans ?? 0}
          pending_loans={pending_loans ?? 0}
          settled_loans={settled_loans ?? 0}
          total_disbursed={total_disbursed ?? 0}
          total_payments={total_payments ?? 0}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive
            daily_applicant_data={(daily_applicant_data ?? []).map((data) => ({
              date: data.date,
              applicants: data.applicant_count,
            }))}
          />
        </div>
      </div>
    </div>
  );
}