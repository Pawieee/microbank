"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { fuzzyFilter } from "./data-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./column-header";

export type LoansColumnProps = {
  loan_id: string;
  applicant_name: string;
  applicant_id: number;
  email: string;
  amount: number;
  duration: number;
  status: "approved" | "settled";
  date_applied: string;
};

export const LoansColumn: ColumnDef<LoansColumnProps>[] = [
  {
    accessorKey: "loan_id",
    header: "Loan ID",
    filterFn: fuzzyFilter,
  },
  {
    accessorKey: "applicant_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => row.original.applicant_name,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "duration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Term" />
    ),
    cell: ({ row }) => `${row.getValue("duration")} months`,
    filterFn: (row, id, filterValue) => {
      return filterValue.includes(String(row.getValue(id)));
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const displayStatus = status === "Approved" ? "Ongoing" : "Settled";

      const statusColorMap: Record<string, string> = {
        Ongoing: "bg-green-100 text-green-800",
        Settled: "bg-blue-100 text-blue-800",
      };

      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusColorMap[displayStatus] || "bg-gray-100 text-gray-800"
          }`}
        >
          {displayStatus}
        </span>
      );
    },
  },

  {
    accessorKey: "date_applied",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Applied" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("date_applied");
      const date = new Date(rawDate as string);

      const formatted = date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(payment.loan_id);
              }}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem>View client</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
