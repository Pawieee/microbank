/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive area chart";

type ChartProps = {
  daily_applicant_data: { date: string; applicants: number }[];
};

export const ChartAreaInteractive = ({ daily_applicant_data }: ChartProps) => {
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    console.log("Time Range changed:", timeRange);
  }, [timeRange]);

  const getFilteredData = () => {
    const referenceDate = new Date();
    let daysToSubtract = 120;

    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Sort data by date just in case, otherwise the line chart might look messy
    return daily_applicant_data
      .filter((item) => {
        const date = new Date(item.date);
        return date >= startDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const [filteredData, setFilteredData] = React.useState(daily_applicant_data);

  React.useEffect(() => {
    setFilteredData(getFilteredData());
  }, [timeRange, daily_applicant_data]);

  const chartConfig: ChartConfig = {
    applicants: {
      label: <span>Applicants</span>,
      theme: { light: "#fff", dark: "#333" },
    },
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Applicants</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        
        {/* CHECK IF FILTERED DATA EXISTS */}
        {filteredData && filteredData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillApplicants" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                defaultIndex={10} 
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="applicants"
                type="monotone"
                fill="url(#fillApplicants)"
                stroke="var(--color-primary)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          /* PLACEHOLDER IF NO DATA */
          <div className="flex h-[250px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
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
              <p className="font-medium">No Data Available</p>
              <p className="text-xs">
                {daily_applicant_data.length === 0
                  ? "No applicants recorded yet."
                  : "No applicants found for this time range."}
              </p>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};