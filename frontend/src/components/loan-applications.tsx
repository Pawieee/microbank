import { DataTable } from "@/components/data-table";
import data from "../app/dashboard/data.json";

export default function Applications() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6">
        <DataTable data={data} />
      </div>
    </div>
  );
}
