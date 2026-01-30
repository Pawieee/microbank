/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { applicationColumns } from "@/components/columns";
import { useApplications } from "@/hooks/useApplications";
import { Release } from "./release-dialog";
import { PaginationState } from "@tanstack/react-table";
import { AccessDenied } from "./access-denied";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconAlertCircle, IconFiles } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

export default function Applications() {
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
    const role = localStorage.getItem("role");
    if (role === "admin") {
      setIsRestricted(true);
    } else if (error && (error.includes("403") || error.toLowerCase().includes("permission"))) {
      setIsRestricted(true);
    }
    setIsClientCheckLoading(false);
  }, [error]);

  const tableData = useMemo(() => {
    return data.map((app) => ({
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
      disbursement_account_number: app.disbursement_account_number || "N/A"
    }));
  }, [data]);

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
            <Badge variant="outline" className="px-2 h-6 text-xs font-semibold border-amber-200 bg-amber-50 text-amber-700">
              {tableData.length} Review Pending
            </Badge>
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
          <p className="font-medium text-sm">No pending applications found</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>Refresh</Button>
        </div>
      ) : (
        <DataTable
          columns={applicationColumns}
          data={tableData}
          onRowClick={handleRowClick}
          pagination={pagination}
          onPaginationChange={setPagination}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          searchableColumns={["loan_id", "applicant_name"]}
        />
      )}

      {/* DIALOG: Passing ALL available data from the row */}
      {selectedRow && (
        <Release
          {...selectedRow}
          onClose={() => {
            setSelectedRow(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}