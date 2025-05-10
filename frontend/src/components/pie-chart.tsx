"use client";

import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LoanPieChartProps {
  approved_loans: number;
  settled_loans: number;
  total_loans: number;
  pending_loans: number;
}

export function LoanPieChart({
  approved_loans,
  settled_loans,
  total_loans,
  pending_loans,
}: LoanPieChartProps) {
  const chartData = [
    {
      label: "Ongoing",
      value: approved_loans,
      fill: "#2D2D2D",
    },
    {
      label: "Settled",
      value: settled_loans,
      fill: "#444444",
    },
    {
      label: "Pending",
      value: pending_loans,
      fill: "#666666",
    },
  ];

  const chartConfig = {
    value: {
      label: "Loans",
    },
    Ongoing: {
      label: "Ongoing",
      color: "#ffffff",
    },
    Settled: {
      label: "Settled",
      color: "#444444",
    },
    Pending: {
      label: "Pending",
      color: "#666666",
    },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Total Loan</CardTitle>
        <CardDescription>Pending / Ongoing / Settled</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={50}
              strokeWidth={3}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {total_loans.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Loans
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
