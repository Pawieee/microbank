"use client";

import { PaginationState } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { columns } from "./logs-column";
import { Spinner } from "./spinner";
import { useLogs } from "@/hooks/useLogs";

export default function Logs() {
  const navigate = useNavigate();
  const { data, loading, error } = useLogs();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    // 1. Role Check
    const role = localStorage.getItem("role");
    
    // Only ADMINS allowed
    if (role !== "admin") {
      setIsForbidden(true);
    }
  }, []);

  if (loading && !isForbidden) {
    return <Spinner />;
  }

  // 3. UNIFORM RESTRICTED UI (Matches Dashboard Exactly)
  if (isForbidden || (error && error.includes("403"))) {
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
            <button 
                onClick={() => navigate(-1)} 
                className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
                Go Back
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left mb-4">Audit Logs</h2>
      {error ? (
        <div className="text-red-500">Error loading logs: {error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  );
}