"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { loanColumns as LoansColumn } from "./columns";
import { useLoans } from "@/hooks/useLoans";
import { PaginationState } from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { AccessDenied } from "./access-denied";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Loans() {
  const navigate = useNavigate();
  // Ensure your hook exposes refetch
  const { data, loading, error, refetch } = useLoans();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isForbidden, setIsForbidden] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. ROLE & SECURITY CHECK
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      setIsForbidden(true);
      setIsClientCheckLoading(false);
      return;
    }

    if (error && (error.includes("403") || error.toLowerCase().includes("permission"))) {
      setIsForbidden(true);
    }
    setIsClientCheckLoading(false);
  }, [error]);

  // 2. DATA PREPARATION
  const tableData = useMemo(() => {
    return (data || []).map((app) => ({
      ...app,
      loan_id: String(app.loan_id),
      applicant_idid: String(app.applicant_id),
      status: app.status as "approved" | "settled",
    }));
  }, [data]);

  const handleRefresh = async () => {
    if (refetch) {
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 500);
    } else {
      window.location.reload();
    }
  };

  const handleRowClick = (rowId: string) => {
    navigate(`/pages/loans/${rowId}`);
  };

  // --- RENDER STATES ---

  if (isForbidden) return <AccessDenied />;

  if (isClientCheckLoading || (loading && !tableData.length)) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading active loans...</span>
      </div>
    );
  }

  if (error && !isForbidden && !tableData.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-red-500 gap-2">
        <p>Error loading data: {error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 space-y-6">

      {/* HEADER: Cleaned up */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Active Loans</h2>
            <Badge variant="secondary" className="px-2 h-6 text-xs font-semibold">
              {tableData.length} Records
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor ongoing loan accounts, payment progress, and settlement status.
          </p>
        </div>
      </div>

      <DataTable
        columns={LoansColumn}
        data={tableData}
        onRowClick={(row) => handleRowClick(row.loan_id)}
        pagination={pagination}
        onPaginationChange={setPagination}

        // ADDED REFRESH HERE
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}

        searchableColumns={["loan_id", "applicant_name"]}
        filterFields={[
          { id: "status", title: "Status", options: [{ label: "Ongoing", value: "approved" }, { label: "Settled", value: "settled" }] }
        ]}
      />
    </div>
  );
}