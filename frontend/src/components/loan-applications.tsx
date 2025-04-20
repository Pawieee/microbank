"use client";

import { useEffect, useState } from "react";
import { LoanApplication, columns } from "./columns";
import { DataTable } from "./data-table";

export default function LoanApplications() {
  const [data, setData] = useState<LoanApplication[]>([]);

  useEffect(() => {
    async function fetchData() {
      const result = await getData();
      setData(result);
    }

    fetchData();
  }, []);

  async function getData(): Promise<LoanApplication[]> {
    // Fetch data from your API here.
    return [
      {
        id: "loan-001",
        applicantName: "Juan Dela Cruz",
        email: "juan@example.com",
        amount: 10000,
        term: 12,
        status: "pending",
        dateApplied: "2024-12-01",
      },
      {
        id: "loan-002",
        applicantName: "Maria Santos",
        email: "maria@example.com",
        amount: 20000,
        term: 24,
        status: "approved",
        dateApplied: "2025-01-15",
      },
      {
        id: "loan-003",
        applicantName: "Jose Rizal",
        email: "rizal@example.com",
        amount: 15000,
        term: 18,
        status: "rejected",
        dateApplied: "2025-03-01",
      },
      {
        id: "loan-004",
        applicantName: "Ana Lopez",
        email: "ana@example.com",
        amount: 12000,
        term: 6,
        status: "pending",
        dateApplied: "2025-02-28",
      },
      {
        id: "loan-005",
        applicantName: "Carlos Garcia",
        email: "carlos@example.com",
        amount: 18000,
        term: 36,
        status: "approved",
        dateApplied: "2024-11-11",
      },
      {
        id: "loan-006",
        applicantName: "Sofia Reyes",
        email: "sofia@example.com",
        amount: 8000,
        term: 12,
        status: "pending",
        dateApplied: "2025-01-20",
      },
      {
        id: "loan-007",
        applicantName: "Miguel Torres",
        email: "miguel@example.com",
        amount: 25000,
        term: 48,
        status: "rejected",
        dateApplied: "2024-10-10",
      },
      {
        id: "loan-008",
        applicantName: "Isabella Cruz",
        email: "isabella@example.com",
        amount: 22000,
        term: 36,
        status: "approved",
        dateApplied: "2025-04-01",
      },
      {
        id: "loan-009",
        applicantName: "Luis Mendoza",
        email: "luis@example.com",
        amount: 13000,
        term: 18,
        status: "pending",
        dateApplied: "2025-03-20",
      },
      {
        id: "loan-010",
        applicantName: "Gabriela Bautista",
        email: "gabriela@example.com",
        amount: 9000,
        term: 12,
        status: "approved",
        dateApplied: "2025-01-10",
      },
      {
        id: "loan-011",
        applicantName: "Marco Ramos",
        email: "marco@example.com",
        amount: 17000,
        term: 24,
        status: "pending",
        dateApplied: "2024-12-25",
      },
      {
        id: "loan-012",
        applicantName: "Angelica David",
        email: "angelica@example.com",
        amount: 14000,
        term: 18,
        status: "approved",
        dateApplied: "2025-02-02",
      },
      {
        id: "loan-013",
        applicantName: "Diego Fernandez",
        email: "diego@example.com",
        amount: 11000,
        term: 6,
        status: "rejected",
        dateApplied: "2025-01-05",
      },
      {
        id: "loan-014",
        applicantName: "Patricia Aquino",
        email: "patricia@example.com",
        amount: 26000,
        term: 48,
        status: "approved",
        dateApplied: "2025-03-15",
      },
      {
        id: "loan-015",
        applicantName: "Roberto Cruz",
        email: "roberto@example.com",
        amount: 10000,
        term: 12,
        status: "pending",
        dateApplied: "2025-04-10",
      },
      {
        id: "loan-016",
        applicantName: "Clarissa Tan",
        email: "clarissa@example.com",
        amount: 30000,
        term: 60,
        status: "approved",
        dateApplied: "2024-09-09",
      },
      {
        id: "loan-017",
        applicantName: "Enrique Navarro",
        email: "enrique@example.com",
        amount: 20000,
        term: 36,
        status: "pending",
        dateApplied: "2025-02-22",
      },
      {
        id: "loan-018",
        applicantName: "Lorena Perez",
        email: "lorena@example.com",
        amount: 16000,
        term: 24,
        status: "rejected",
        dateApplied: "2024-08-30",
      },
      {
        id: "loan-019",
        applicantName: "Kevin Santos",
        email: "kevin@example.com",
        amount: 19000,
        term: 30,
        status: "approved",
        dateApplied: "2025-03-03",
      },
      {
        id: "loan-020",
        applicantName: "Melissa Velasco",
        email: "melissa@example.com",
        amount: 21000,
        term: 36,
        status: "pending",
        dateApplied: "2025-04-05",
      },
      // Add more if needed
    ];
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
