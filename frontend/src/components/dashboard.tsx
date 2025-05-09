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
