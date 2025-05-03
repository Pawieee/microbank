"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { LoansColumn } from "./loans-column";
import { useLoans } from "@/hooks/useLoans";

export default function Loans() {
  const { data, loading, error } = useLoans();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleRowClick = (rowId: string) => {
    navigate(`/pages/loans/${rowId}`); // ✅ Navigate to loan details page
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Loans</h2>
      <DataTable
        columns={LoansColumn}
        data={data.map((app) => ({
          ...app,
           // Add id field to match LoansColumnProps
          loan_id: String(app.loan_id),
          applicant_idid: String(app.applicant_id),
          status: app.status as "approved" | "settled", // Ensure status matches the expected type
        }))} // Convert id to string
        onRowClick={(row) => handleRowClick(row.loan_id)}
      />
    </div>
  );
}
