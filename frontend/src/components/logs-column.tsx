"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LogEntry } from "@/hooks/useLogs";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<LogEntry>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          // FIX: Added 'pl-0 justify-start' to align header text to the left
          className="pl-0 hover:bg-transparent justify-start" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"));
      return (
        // Data is already left-aligned, so header now matches it.
        <div className="flex flex-col text-left"> 
            <span className="font-medium">
                {date.toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => (
        <div className="font-medium text-primary">
            {row.getValue("username") || "System"}
        </div>
    )
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
        const action = row.getValue("action") as string;
        let colorClass = "bg-gray-100 text-gray-700";
        if (action === "LOGIN") colorClass = "bg-blue-100 text-blue-700";
        if (action === "DISBURSE_LOAN") colorClass = "bg-green-100 text-green-700";
        if (action === "REJECTED") colorClass = "bg-red-100 text-red-700";
        if (action === "UNAUTHORIZED_ACCESS") colorClass = "bg-red-50 text-red-600 border border-red-200";

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${colorClass}`}>
                {action}
            </span>
        );
    }
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => (
        <div className="max-w-[400px] truncate" title={row.getValue("details")}>
            {row.getValue("details")}
        </div>
    ),
  },
];