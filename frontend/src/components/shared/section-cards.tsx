import {
  IconTrendingUp,
  IconActivity,
  IconChartPie
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoanPieChart } from "../feature/charts/pie-chart";

interface SectionCardsProps {
  approved_loans: number;
  pending_loans: number;
  settled_loans: number;
  total_disbursed: number;
  total_payments: number;
}

export function SectionCards({
  approved_loans,
  pending_loans,
  settled_loans,
  total_disbursed,
  total_payments,
}: SectionCardsProps) {
  const total_loans = approved_loans + pending_loans + settled_loans;
  const outstanding_balance = total_disbursed - total_payments;
  const average_loan_amount = total_loans > 0 ? total_disbursed / total_loans : 0;

  // --- DYNAMIC CALCULATIONS ---

  // 1. Recovery Rate: How much of the money lent has come back?
  const recoveryRate = total_disbursed > 0
    ? ((total_payments / total_disbursed) * 100)
    : 0;

  // 2. Active Ratio: Percentage of portfolio still outstanding
  const exposureRate = total_disbursed > 0
    ? ((outstanding_balance / total_disbursed) * 100)
    : 0;

  // 3. Approval Context (Approximated for this view)
  const activeLoansCount = approved_loans + settled_loans;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
      <LoanPieChart
        approved_loans={approved_loans ?? 0}
        settled_loans={settled_loans ?? 0}
        total_loans={total_loans ?? 0}
        pending_loans={pending_loans ?? 0}
      />

      {/* COLUMN 2 */}
      <div className="flex flex-col gap-4">
        {/* TOTAL PAYMENTS CARD */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Collections</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {`₱${new Intl.NumberFormat("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(total_payments)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <IconTrendingUp className="mr-1 size-3" />
                {recoveryRate.toFixed(1)}% Recov.
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-emerald-700">
              Recovery Health <IconActivity className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Percentage of principal recovered
            </div>
          </CardFooter>
        </Card>

        {/* DISBURSED CARD */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Disbursed Amount</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {`₱${new Intl.NumberFormat("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(total_disbursed)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <IconChartPie className="mr-1 size-3" />
                {activeLoansCount} Loans
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-700">
              Portfolio Volume <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Total capital deployed to borrowers
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* COLUMN 3 */}
      <div className="flex flex-col gap-4">
        {/* OUTSTANDING CARD */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Outstanding Balance</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {`₱${new Intl.NumberFormat("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(outstanding_balance)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <IconActivity className="mr-1 size-3" />
                {exposureRate.toFixed(1)}% Active
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-amber-700">
              Current Exposure <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Capital currently held by borrowers
            </div>
          </CardFooter>
        </Card>

        {/* AVERAGE LOAN CARD */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Average Loan Size</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {`₱${new Intl.NumberFormat("en-PH", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(average_loan_amount)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200">
                Avg
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-zinc-700">
              Market Position <IconChartPie className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Mean principal value per borrower
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}