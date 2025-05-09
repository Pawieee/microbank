"use client";

import { ColumnDef } from "@tanstack/react-table";
import { fuzzyFilter } from "./data-table"; // Ensure this is the correct library

import { DataTableColumnHeader } from "./column-header";

export type Log = {
  id: string;
  action: string;
  performed_by: string;
  target_type: string;
  target_id: string | number;
  details: string;
  date_time: string;
  status: "success" | "failed";
};

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Log ID" />
    ),
    filterFn: fuzzyFilter,
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    filterFn: fuzzyFilter,
    cell: ({ row }) => row.original.action,
  },
  {
    accessorKey: "performedBy",
    header: "Performed By",
    filterFn: fuzzyFilter,
  },
  {
    accessorKey: "targetType",
    header: "Target Type",
  },
  {
    accessorKey: "targetId",
    header: "Target ID",
  },
  {
    accessorKey: "dateTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date & Time" />
    ),
    filterFn: fuzzyFilter,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

      const statusColorMap: Record<string, string> = {
        success: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
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
];
