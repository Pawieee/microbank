"use client";

import { useNavigate } from "react-router-dom";
import { DataTable } from "./data-table";
import { LoansColumn } from "./loans-column";
import { useLoans } from "@/hooks/useLoans";
import { PaginationState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

export default function Loans() {
  const { data, loading, error } = useLoans();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const tableData = useMemo(() => {
    return data.map((app) => ({
      ...app,
      loan_id: String(app.loan_id),
      applicant_idid: String(app.applicant_id),
      status: app.status as "approved" | "settled",
    }));
  }, [data]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleRowClick = (rowId: string) => {
    navigate(`/pages/loans/${rowId}`);
  };

  return (
    <div className="w-full mt-6 mx-auto px-10">
      <h2 className="text-3xl font-bold text-left">Loans</h2>
      <DataTable
        columns={LoansColumn}
        data={tableData}
        onRowClick={(row) => handleRowClick(row.loan_id)}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
