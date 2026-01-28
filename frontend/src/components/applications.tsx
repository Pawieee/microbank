/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { ApplicationsColumns } from "./applications-column";
import { useApplications } from "@/hooks/useApplications";
import { Release } from "./release-dialog";
import { PaginationState } from "@tanstack/react-table";

export default function Applications() {
  const navigate = useNavigate();
  
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
  if (isRestricted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 bg-red-100 rounded-full text-red-600 dark:bg-red-900/20">
            {/* Lock Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 10m0 0a2 2 0 0 1 2 2a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2a2 2 0 0 1 2 -2"/><path d="M12 14v2"/><path d="M12 8v.01"/></svg>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Restricted Access</h2>
            <p className="text-muted-foreground max-w-[400px]">
              You do not have permission to view this page.
            </p>
        </div>

        <div className="mt-2">
            <Button 
                variant="default"
                onClick={() => navigate(-1)} 
            >
                Go back
            </Button>
        </div>
      </div>
    );
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