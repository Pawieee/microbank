/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { ApplicationsColumns } from "./applications-column";
import { useApplications } from "@/hooks/useApplications";
import { Release } from "./release-dialog";

export default function Applications() {
  const { data, loading, error } = useApplications();
  const [selectedRow, setSelectedRow] = useState<any | null>(null); // state for selected row

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData); // open the dialog with row data
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Applications</h2>

      <DataTable
        columns={ApplicationsColumns}
        data={data.map((app) => ({
          loan_id: String(app.loan_id),
          applicant_name: app.applicant_name,
          applicant_id: app.applicant_id,
          email: app.email,
          amount: app.amount,
          duration: app.duration,
          status: app.status,
          date_applied: app.date_applied,
        }))}
        onRowClick={handleRowClick}
      />

      {/* Render the Release dialog when a row is selected */}
      {selectedRow && (
        <Release
          loan_id={selectedRow.loan_id}
          applicant_id={selectedRow.applicant_id}
          applicant_name={selectedRow.applicant_name}
          email={selectedRow.email}
          amount={selectedRow.amount}
          duration={selectedRow.duration}
          date_applied={selectedRow.date_applied}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
