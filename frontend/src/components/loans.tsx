"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { columns } from "./loans-column";
import { useLoans } from "@/hooks/useLoans";

export default function Loans() {
  const { data, loading, error } = useLoans(); // Get data, loading, and error from the custom hook
  const navigate = useNavigate();

  // If the data is still loading, you can show a loading spinner or message
  if (loading) {
    return <div>Loading...</div>;
  }

  // If there’s an error, show an error message
  if (error) {
    return <div>{error}</div>;
  }

  // Handle row click to navigate to details
  const handleRowClick = (rowId: string) => {
    navigate(`/pages/loans/${rowId}`); // ✅ Navigate to loan details page
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
        <h2 className="text-3xl font-bold text-left">Loans</h2>
      <DataTable
        columns={columns}
        data={data} // Pass mock data
        onRowClick={(row) => handleRowClick(row.id)} // Navigate on row click
      />
    </div>
  );
}
