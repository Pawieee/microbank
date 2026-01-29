"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { LoansColumn } from "./loans-column";
import { useLoans } from "@/hooks/useLoans";
import { PaginationState } from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { AccessDenied } from "./access-denied"; // Import your new component
import { Loader2 } from "lucide-react"; // Optional: Better spinner

export default function Loans() {
  const navigate = useNavigate();
  const { data, loading, error } = useLoans();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isForbidden, setIsForbidden] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);

  // 1. ROLE & SECURITY CHECK
  useEffect(() => {
    // A. Client-Side Check
    const role = localStorage.getItem("role");

    // BLOCK ADMINS: They are IT support, not authorized to view Loan PII
    if (role === "admin") {
      setIsForbidden(true);
      setIsClientCheckLoading(false);
      return;
    }

    // B. Backend-Side Check (Reactive)
    // If the API hook returns a 403 error, lock the UI
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

  // 3. RESTRICTED UI (Show the Wall)
  if (isForbidden) {
    return (
      <AccessDenied />
    );
  }

  // 4. LOADING STATE
  if (isClientCheckLoading || (loading && !isForbidden)) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading active loans...</span>
      </div>
    );
  }

  // 5. ERROR STATE (Generic errors, not permission ones)
  if (error && !isForbidden) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-red-500">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  const handleRowClick = (rowId: string) => {
    navigate(`/pages/loans/${rowId}`);
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-left tracking-tight">Active Loans</h2>
          <p className="text-muted-foreground">Manage ongoing loans and repayment schedules.</p>
        </div>
      </div>

      <DataTable
        columns={LoansColumn}
        data={tableData}
        onRowClick={(row) => handleRowClick(row.loan_id)}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}