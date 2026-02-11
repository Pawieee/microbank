/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { applicationColumns } from "@/components/data-table/columns";
import { useApplications } from "@/hooks/useApplications";
import { Release } from "@/components/feature/loans/release-dialog";
import { PaginationState } from "@tanstack/react-table";
import { AccessDenied } from "@/components/shared/access-denied";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconAlertCircle, IconFiles } from "@tabler/icons-react";
import { Loader2, Clock, CheckCircle2 } from "lucide-react"; 
import { useAuth } from "@/hooks/useAuth"; // ✅ Import Auth Hook

export default function Applications() {
  // ✅ Get permissions from the hook
  const { isAdmin } = useAuth();
  const { data, loading, error, refetch } = useApplications();

  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isRestricted, setIsRestricted] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // ✅ Logic updated to use hook variable 'isAdmin'
    if (isAdmin) {
      setIsRestricted(true);
    } else if (error && (error.includes("403") || error.toLowerCase().includes("permission"))) {
      setIsRestricted(true);
    }
    
    setIsClientCheckLoading(false);
  }, [error, isAdmin]);

  const tableData = useMemo(() => {
    return data.map((app) => ({
      ...app,
      loan_id: String(app.loan_id),
      applicant_name: app.applicant_name,
      applicant_id: app.applicant_id,
      email: app.email,
      amount: app.amount,
      duration: app.duration,
      status: app.status, 
      date_applied: app.date_applied,
      credit_score: app.credit_score || "N/A",
      monthly_income: app.monthly_income || 0,
      loan_purpose: app.loan_purpose || "General",
      payment_schedule: app.payment_schedule || "Monthly",
      employment_status: app.employment_status || "Unspecified",
      gender: app.gender || "Unspecified",
      civil_status: app.civil_status || "Unspecified",
      phone_num: app.phone_num || "N/A",
      address: app.address || "No address",
      id_type: app.id_type || "None",
      id_image_data: app.id_image_data || "",
      disbursement_method: app.disbursement_method || "Cash Pickup",
      disbursement_account_number: app.disbursement_account_number || "N/A",
      remarks: app.remarks || ""
    }));
  }, [data]);

  // Calculate Counts
  const pendingCount = tableData.filter(i => i.status === "Pending").length;
  const forReleaseCount = tableData.filter(i => i.status === "For Release").length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData);
  };

  if (isRestricted) return <AccessDenied />;

  if (isClientCheckLoading || (loading && !data.length)) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <span className="text-sm font-medium">Retrieving applications...</span>
      </div>
    );
  }

  if (error && !data.length) {
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
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Loan Applications</h2>
            
            {/* PENDING BADGE */}
            {pendingCount > 0 && (
              <Badge variant="outline" className="px-2 h-6 text-xs font-semibold border-amber-200 bg-amber-50 text-amber-700 gap-1">
                <Clock size={12} />
                {pendingCount} Review Pending
              </Badge>
            )}

            {/* FOR RELEASE BADGE - NEW */}
            {forReleaseCount > 0 && (
              <Badge variant="outline" className="px-2 h-6 text-xs font-semibold border-blue-200 bg-blue-50 text-blue-700 gap-1">
                <CheckCircle2 size={12} />
                {forReleaseCount} Ready for Release
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Review applicant risk profiles and approve pending disbursement requests.
          </p>
        </div>
      </div>

      {tableData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-md bg-white border-dashed">
          <div className="p-4 bg-zinc-50 rounded-full">
            <IconFiles className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium text-sm">No applications found</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>Refresh</Button>
        </div>
      ) : (
        <DataTable
          columns={applicationColumns}
          data={tableData}
          onRowClick={handleRowClick}
          pagination={pagination}
          onPaginationChange={setPagination}
          searchableColumns={["loan_id", "applicant_name"]}
        />
      )}

      {selectedRow && (
        <Release
          {...selectedRow}
          onClose={() => {
            setSelectedRow(null);
            refetch(); // Refresh list when dialog closes to update status
          }}
        />
      )}
    </div>
  );
}