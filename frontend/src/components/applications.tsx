"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { ApplicationsColumns } from "./applications-column";
import { useApplications } from "@/hooks/useApplications";

export default function Applications() {
  const { data, loading, error } = useApplications();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleRowClick = (rowId: string) => {
    navigate(`/pages/applications/${rowId}`); // ✅ Navigate to loan details page
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Applications</h2>
      <DataTable
        columns={ApplicationsColumns}
        data={data.map((app) => ({ ...app, id: String(app.id) }))} // Convert id to string
        onRowClick={(row) => handleRowClick(row.id)}
      />
    </div>
  );
}
