import { SectionCards } from "@/components/shared/section-cards";
// ✅ Fix 1: Import the hook, not the raw fetch function
import { useDashboard } from "@/hooks/useDashboard"; 
import { ChartAreaInteractive } from "@/components/feature/charts/chart-area-interactive";
import { AccessDenied } from "@/components/shared/access-denied";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  const { isManager } = useAuth();
  
  // ✅ Fix 2: Use the hook to handle state, loading, and fetching automatically
  const { stats, loading, error } = useDashboard();

  // 1. Permission Check (Fast Fail)
  if (!isManager) return <AccessDenied />;

  // 2. Loading State
  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading dashboard...</div>;

  // 3. Error State
  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-red-500">
        <IconExclamationCircle size={32} />
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

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
              <div className="flex justify-between items-start">
                  <div>
                      <CardDescription>Projected Revenue</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {`₱${new Intl.NumberFormat("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(net_revenue)}`}
                      </CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-1">
                      <IconPercentage size={12} className="mr-1" />
                      {yieldRate.toFixed(1)}% Yield
                  </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm pt-0">
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
               <div className="flex justify-between items-start">
                  <div>
                      <CardDescription>Rejected Applications</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-red-600">
                        {rejected_loans}
                      </CardTitle>
                  </div>
                  <Badge variant="outline" className={`mt-1 ${
                      rejectionRate > 30
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}>
                      <IconTrendingDown size={12} className="mr-1" />
                      {rejectionRate.toFixed(1)}% Rate
                  </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm pt-0">
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
                <div className="h-[200px] w-full">
                    <ChartContainer config={purposeConfig} className="h-full w-full">
                      <BarChart data={loan_purpose_data} layout="vertical" margin={{ left: 0, right: 30 }} width={300} height={200}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={4}>
                          {loan_purpose_data.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <LabelList dataKey="value" position="right" offset={8} fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                </div>
              ) : (
                <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-4">
                    <IconChartBar className="h-6 w-6 opacity-50" />
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
                      {mappedDemoData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex aspect-square max-h-[250px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-4">
                    <IconChartPie className="h-6 w-6 opacity-50" />
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