import { useEffect, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { fetchDashboardStats, DashboardStats } from "@/lib/dashboard-stats";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchDashboardStats();
      setStats(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Destructure the individual stats from the fetched data
  const {
    total_loans,
    approved_loans,
    pending_loans,
    settled_loans,
    total_applicants,
    total_disbursed,
    total_payments,
  } = stats || {}; // Ensure stats is not null

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6">
        <SectionCards
          total_loans={total_loans ?? 0}
          approved_loans={approved_loans ?? 0}
          pending_loans={pending_loans ?? 0}
          settled_loans={settled_loans ?? 0}
          total_disbursed={total_disbursed ?? 0}
          total_payments={total_payments ?? 0}
          total_applicants={total_applicants ?? 0}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
      </div>
    </div>
  );
}
