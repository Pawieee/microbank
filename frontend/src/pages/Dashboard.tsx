import { useEffect, useState } from "react";
import { SectionCards } from "@/components/shared/section-cards";
import { fetchDashboardStats, DashboardStats } from "@/hooks/useDashboard";
import { ChartAreaInteractive } from "@/components/feature/charts/chart-area-interactive";
import { AccessDenied } from "../components/shared/access-denied";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconChartPie,
  IconChartBar,
  IconExclamationCircle,
  IconPercentage
} from "@tabler/icons-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, LabelList
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "teller" || role === "admin") {
      setIsForbidden(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await fetchDashboardStats();
        if (!data) setIsForbidden(true);
        else setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setIsForbidden(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading dashboard...</div>;
  if (isForbidden) return <AccessDenied />;

  const {
    approved_loans = 0,
    pending_loans = 0,
    settled_loans = 0,
    rejected_loans = 0,
    total_disbursed = 0,
    total_payments = 0,
    net_revenue = 0,
    daily_applicant_data = [],
    loan_purpose_data = [],
    demographic_data = []
  } = stats || {};

  // --- DYNAMIC CALCULATIONS ---

  // 1. Yield Rate: (Net Revenue / Total Disbursed) * 100
  const yieldRate = total_disbursed > 0
    ? ((net_revenue / total_disbursed) * 100)
    : 0;

  // 2. Rejection Rate: Rejected / (Approved + Rejected + Pending)
  const totalApplications = approved_loans + rejected_loans + pending_loans + settled_loans;
  const rejectionRate = totalApplications > 0
    ? ((rejected_loans / totalApplications) * 100)
    : 0;

  // --- CHART CONFIG ---
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const purposeConfig = {
    count: { label: "Applications", theme: { light: "#2563eb", dark: "#3b82f6" } },
  } satisfies ChartConfig;

  const demoConfig = {
    value: { label: "Applicants" },
    Male: { label: "Male", color: "hsl(var(--chart-1))" },
    Female: { label: "Female", color: "hsl(var(--chart-2))" },
    Other: { label: "Other", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  const mappedDemoData = demographic_data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6">

        {/* 1. ORIGINAL UI (With Updated Badge Logic inside SectionCards) */}
        <SectionCards
          approved_loans={approved_loans}
          pending_loans={pending_loans}
          settled_loans={settled_loans}
          total_disbursed={total_disbursed}
          total_payments={total_payments}
        />

        {/* 2. SECONDARY METRICS (Dynamic Badges) */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">

          {/* REVENUE CARD */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Projected Revenue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {`₱${new Intl.NumberFormat("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(net_revenue)}`}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <IconPercentage size={12} className="mr-1" />
                  {yieldRate.toFixed(1)}% Yield
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-purple-700">
                Interest Income <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Expected earnings based on active loan interest
              </div>
            </CardFooter>
          </Card>

          {/* REJECTED CARD */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Rejected Applications</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-red-600">
                {rejected_loans}
              </CardTitle>
              <CardAction>
                {/* Dynamic Color based on rate */}
                <Badge variant="outline" className={
                  rejectionRate > 30
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                }>
                  <IconTrendingDown size={12} className="mr-1" />
                  {rejectionRate.toFixed(1)}% Rate
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-red-700">
                Risk Filtration <IconExclamationCircle className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Applicants that did not meet credit criteria
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 3. MAIN CHART */}
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive
            daily_applicant_data={daily_applicant_data.map((data: any) => ({
              date: data.date,
              applicants: data.applicant_count,
            }))}
          />
        </div>

        {/* 4. DETAILED ANALYTICS */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">

          {/* LOAN PURPOSES */}
          <Card className="@container/card flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChartBar size={18} className="text-muted-foreground" />
                Loan Purposes
              </CardTitle>
              <CardDescription>Distribution of borrowing reasons</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {loan_purpose_data && loan_purpose_data.length > 0 ? (
                <ChartContainer config={purposeConfig} className="min-h-[200px] w-full">
                  <BarChart data={loan_purpose_data} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={4}>
                      {loan_purpose_data.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList dataKey="value" position="right" offset={8} fontSize={12} />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                /* PLACEHOLDER: Loan Purposes */
                <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 opacity-50"
                    >
                      <line x1="18" x2="18" y1="20" y2="10" />
                      <line x1="12" x2="12" y1="20" y2="4" />
                      <line x1="6" x2="6" y1="20" y2="14" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No Purposes Recorded</p>
                    <p className="text-xs">Loan types will appear here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DEMOGRAPHICS */}
          <Card className="@container/card flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChartPie size={18} className="text-muted-foreground" />
                Demographics
              </CardTitle>
              <CardDescription>Applicant gender distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {mappedDemoData && mappedDemoData.length > 0 ? (
                <ChartContainer config={demoConfig} className="mx-auto aspect-square max-h-[250px]">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={mappedDemoData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                      <LabelList dataKey="value" className="fill-foreground" stroke="none" fontSize={12} />
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                  </PieChart>
                </ChartContainer>
              ) : (
                /* PLACEHOLDER: Demographics */
                <div className="flex aspect-square max-h-[250px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 opacity-50"
                    >
                      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                      <path d="M22 12A10 10 0 0 0 12 2v10z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No Demographics</p>
                    <p className="text-xs">Gender distribution data is empty.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}