"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
// Import fuzzyFilter from a utility library or define it
import { fuzzyFilter } from "./data-table"; // Ensure this is the correct library

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./column-header";

//INTEGRATE PAKO DIRI ZOD SCHEMA FOR MORE FIRM VALIDATION!
export type LoansColumnProps = {
  loan_id: string;
  applicant_name: string;
  applicant_id: number;
  email: string;
  amount: number;
  duration: number; // in months
  status:  "ongoing" | "settled";
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
    header: "Term",
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number;
      return <div>{duration} Months</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

      const statusColorMap: Record<string, string> = {
        Settled: "bg-blue-100 text-blue-800",
        Approved: "bg-green-100 text-green-800",
      };

      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusColorMap[status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {formattedStatus}
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
              onClick={() => navigator.clipboard.writeText(payment.loan_id)}
            >
              Release
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
