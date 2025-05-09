/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { DataTable } from "./data-table";
import { ApplicationsColumns } from "./applications-column";
import { useApplications } from "@/hooks/useApplications";
import { Release } from "./release-dialog";
import { PaginationState } from "@tanstack/react-table";

export default function Applications() {
  const { data, loading, error, refetch } = useApplications();
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
