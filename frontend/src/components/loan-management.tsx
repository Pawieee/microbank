import { DataTable } from "@/components/management-table";

export default function ManageLoans() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6">
        <DataTable />
      </div>
    </div>
  );
}
