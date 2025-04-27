"use client";

import { DataTable } from "./data-table";
import { columns } from "./logs-column";
import { Spinner } from "./spinner";
import { useLogs } from "@/hooks/useLogs";

export default function Logs() {
  const { data, loading, error } = useLogs(); // Get data, loading, and error from the custom hook

  // If the data is still loading, you can show a loading spinner or message
  if (loading) {
    return <Spinner />;
  }

  // If there’s an error, show an error message
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="px-10 py-10">
      <DataTable
        columns={columns}
        data={data} // Pass mock data
      />
    </div>
  );
}
