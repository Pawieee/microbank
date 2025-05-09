import { IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoanPieChart } from "./pie-chart";

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
  const average_loan_amount = total_disbursed / total_loans;
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
      <LoanPieChart
        approved_loans={approved_loans ?? 0}
        settled_loans={settled_loans ?? 0}
        total_loans={total_loans ?? 0}
        pending_loans={pending_loans ?? 0}
      />
      <div className="flex flex-col gap-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Payment</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {`₱${new Intl.NumberFormat("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(total_payments)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +20%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Payments up this period <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Positive trend in repayments, indicating improvement
            </div>
          </CardFooter>
        </Card>

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
              <Badge variant="outline">
                <IconTrendingUp />
                +52%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Disbursements up this period <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              More loans disbursed, suggesting an increase in borrower activity
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
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
              <Badge variant="outline">
                <IconTrendingUp />
                +12.5%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Outstanding balance rising <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              A sign of more loan repayments being deferred
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Average Loan Amount</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {`₱${new Intl.NumberFormat("en-PH", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(average_loan_amount)}`}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +12.5%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Higher loan amounts this period{" "}
              <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Reflects larger loan sizes, possibly indicating increasing
              borrower needs
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
