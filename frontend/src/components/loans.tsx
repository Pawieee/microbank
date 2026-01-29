"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { LoansColumn } from "./loans-column";
import { useLoans } from "@/hooks/useLoans";
import { PaginationState } from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { AccessDenied } from "./access-denied";

export default function Loans() {
  const navigate = useNavigate();
  // The hook handles the fetch, but we control access visibility
  const { data, loading, error } = useLoans();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isRestricted, setIsRestricted] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);

  // 1. ROLE CHECK PATTERN
  useEffect(() => {
    const checkAccess = () => {
      // 1. Role Check (Client Side)
      const role = localStorage.getItem("role");

      // STRICT: Admins (IT/Audit) cannot view operational loan data (PII).
      if (role === "admin") {
        setIsRestricted(true);
        setIsClientCheckLoading(false);
        return;
      }

      // 2. Check for Backend Rejection (403)
      // If the hook returns an error indicating forbidden access, we lock the UI.
      if (error && (error.includes("403") || error.toLowerCase().includes("permission"))) {
        setIsRestricted(true);
      }

      // If we passed the role check, we stop the client check loading
      // (The hook's own loading state will take over if still fetching)
      setIsClientCheckLoading(false);
    };

    checkAccess();
  }, [error]);

  const tableData = useMemo(() => {
    return data.map((app) => ({
      ...app,
      loan_id: String(app.loan_id),
      applicant_idid: String(app.applicant_id),
      status: app.status as "approved" | "settled",
    }));
  }, [data]);

  // 2. RESTRICTED UI
if (isRestricted || (error && error.includes("403"))) {
  return <AccessDenied />;
}
  // 3. LOADING & ERROR STATES
  // Show loading if we are still checking client permissions OR if the hook is fetching
  if (isClientCheckLoading || loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading loans...</div>;
  }

  if (error && !isRestricted) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  const handleRowClick = (rowId: string) => {
    navigate(`/pages/loans/${rowId}`);
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Loans</h2>
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