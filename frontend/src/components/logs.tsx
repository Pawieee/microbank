"use client";

import { PaginationState } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./logs-column";
import { Spinner } from "./spinner";
import { useLogs } from "@/hooks/useLogs";

export default function Logs() {
  const { data, loading, error } = useLogs();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Logs</h2>
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
