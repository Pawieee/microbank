"use client";

import { ColumnDef } from "@tanstack/react-table";
import { fuzzyFilter } from "./data-table";
import { DataTableColumnHeader } from "./column-header";

export type ApplicationsColumnsProps = {
  loan_id: string;
  applicant_name: string;
  applicant_id: number;
  email: string;
  amount: number;
  duration: number;
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Term" />
    ),
    cell: ({ row }) => `${row.getValue("duration")} months`,
    filterFn: (row, id, filterValue) => {
      return filterValue.includes(String(row.getValue(id)));
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
