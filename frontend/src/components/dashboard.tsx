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
    totalLoans,
    totalApprovedLoans,
    totalPendingLoans,
    totalSettledLoans,
    totalOutstanding,
    totalPaidBack,
  } = stats || {}; // Ensure stats is not null

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6">
        <SectionCards
          totalLoans={totalLoans ?? 0}
          totalApprovedLoans={totalApprovedLoans ?? 0}
          totalPendingLoans={totalPendingLoans ?? 0}
          totalSettledLoans={totalSettledLoans ?? 0}
          totalOutstanding={totalOutstanding ?? 0}
          totalPaidBack={totalPaidBack ?? 0}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
      </div>
    </div>
  );
}
