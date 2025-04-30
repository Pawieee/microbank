"use client";

import { ColumnDef } from "@tanstack/react-table";
import { fuzzyFilter } from "./data-table"; // Ensure this is the correct library
import { DataTableColumnHeader } from "./column-header";

//INTEGRATE PAKO DIRI ZOD SCHEMA FOR MORE FIRM VALIDATION!
export type ApplicationsColumnsProps = {
  loan_id: string;
  applicant_name: string;
  applicant_id: number;
  email: string;
  amount: number;
  duration: number; // in months
  status: string;
  date_applied: string;
};

export const ApplicationsColumns: ColumnDef<ApplicationsColumnsProps>[] = [
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
  // {
  //   id: "actions",
  //   cell: ({ row }) => {

  //     return (
  //       <div className="text-right pr-4">
  //         <Release {...row.original} />
  //       </div>
  //     );
  //   },
  // },
];
