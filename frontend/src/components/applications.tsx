/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import { DataTable } from "./data-table";
import { ApplicationsColumns } from "./applications-column";
import { useApplications } from "@/hooks/useApplications";
import { Release } from "./release-dialog";
import { PaginationState } from "@tanstack/react-table";
import { AccessDenied } from "./access-denied";

export default function Applications() {  
  // The hook handles the fetch, but we control access visibility
  const { data, loading, error, refetch } = useApplications();
  
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
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

      // Admins (IT/Audit) cannot view customer applications (PII).
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

      setIsClientCheckLoading(false);
    };

    checkAccess();
  }, [error]); // Re-run if the hook returns a new error (e.g. 403 from server)

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
    }));
  }, [data]);

  // 2. RESTRICTED UI
  if (isRestricted || (error && error.includes("403"))) {
  return <AccessDenied />;
}

  // 3. LOADING & ERROR STATES
  if (isClientCheckLoading || loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading applications...</div>;
  }
  
  if (error && !isRestricted) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData);
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Applications</h2>

      <DataTable
        columns={ApplicationsColumns}
        data={tableData}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      {selectedRow && (
        <Release
          loan_id={selectedRow.loan_id}
          applicant_id={selectedRow.applicant_id}
          applicant_name={selectedRow.applicant_name}
          email={selectedRow.email}
          amount={selectedRow.amount}
          duration={selectedRow.duration}
          date_applied={selectedRow.date_applied}
          onClose={() => {
            setSelectedRow(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}