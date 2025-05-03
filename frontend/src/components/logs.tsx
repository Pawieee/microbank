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
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Logs</h2>
      <DataTable
        columns={columns}
        data={data} // Pass mock data
      />
    </div>
  );
}
