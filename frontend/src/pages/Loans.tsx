/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/data-table/data-table";
import { activeLoanColumns } from "@/components/data-table/columns"; 
import { useLoans } from "@/hooks/useLoans";
import { PaginationState } from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { AccessDenied } from "../components/shared/access-denied";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { IconBuildingBank, IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth"; // ✅ Import Auth Hook

export default function Loans() {
  const navigate = useNavigate();
  // ✅ Get permissions from hook
  const { isAdmin } = useAuth();
  
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
    // ✅ Logic updated to use hook variable
    if (isAdmin) {
      setIsForbidden(true);
      setIsClientCheckLoading(false);
      return;
    }

    if (error && (error.includes("403") || error.toLowerCase().includes("permission"))) {
      setIsForbidden(true);
    }
    setIsClientCheckLoading(false);
  }, [error, isAdmin]);

  // 2. DATA PREPARATION (View Logic)
  const tableData = useMemo(() => {
    return (data || []).map((loan) => ({
      ...loan, 
      loan_id: String(loan.loan_id),
      status: loan.status.toLowerCase() as "approved" | "settled",
      
      // Formatting numbers for the table sorting/filtering to work correctly
      amount: Number(loan.amount), 
      balance: Number(loan.balance || loan.amount), 
      due_amount: Number(loan.due_amount || 0),
      next_due: loan.next_due,
      
      // Handling potential nulls from backend
      credit_score: loan.credit_score || "N/A",
      monthly_income: loan.monthly_income || 0,
      phone_num: loan.phone_number || loan.phone_num || "", // Handle alias
      loan_purpose: loan.loan_purpose || "General",
      id_image_data: loan.id_image_data || "",
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

  const handleRowClick = (rowData: any) => {
    navigate(`/pages/loans/${rowData.loan_id}`, { state: { loanData: rowData } });
  };

  // --- RENDER STATES ---

  if (isForbidden) return <AccessDenied />;

  if (isClientCheckLoading || (loading && !tableData.length)) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <span className="text-sm font-medium">Retrieving active portfolio...</span>
      </div>
    );
  }

  if (error && !isForbidden && !tableData.length) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-red-500">
        <div className="p-3 bg-red-50 rounded-full"><IconAlertCircle size={32} /></div>
        <p className="font-medium">Error loading data: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Active Loans</h2>
            <Badge variant="outline" className="px-2 h-6 text-xs font-semibold border-emerald-200 bg-emerald-50 text-emerald-700">
              {tableData.filter((l: any) => l.status === 'approved').length} Active Accounts
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor ongoing loan accounts, track repayment progress, and manage settlements.
          </p>
        </div>
      </div>

      {tableData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-md bg-white border-dashed">
          <div className="p-4 bg-zinc-50 rounded-full">
            <IconBuildingBank className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium text-sm">No active loans found</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>Refresh</Button>
        </div>
      ) : (
        <DataTable
          columns={activeLoanColumns} 
          data={tableData}
          onRowClick={handleRowClick}
          pagination={pagination}
          onPaginationChange={setPagination}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          searchableColumns={["loan_id", "applicant_name"]}
          filterFields={[
            { id: "status", title: "Account Status", options: [{ label: "Active", value: "approved" }, { label: "Settled", value: "settled" }] }
          ]}
        />
      )}
    </div>
  );
}