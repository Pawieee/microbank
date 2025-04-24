import { useEffect, useState } from "react";

type Loan = {
  id: string;
  applicantName: string;
  email: string;
  amount: number;
  term: number; // in months
  status: "pending" | "approved" | "rejected";
  dateApplied: string;
};

export const useLoan = (loanId: string | undefined) => {
  const [data, setData] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loanId) return;

    // Mock Data (Same as your useLoans.tsx data)
    const mockData: Loan[] = [
      {
        id: "1",
        applicantName: "John Doe",
        email: "john@example.com",
        amount: 5000,
        term: 12,
        status: "approved",
        dateApplied: "2023-03-01",
      },
      {
        id: "2",
        applicantName: "Jane Smith",
        email: "jane@example.com",
        amount: 10000,
        term: 24,
        status: "pending",
        dateApplied: "2023-04-15",
      },
      {
        id: "3",
        applicantName: "Mark Johnson",
        email: "mark@example.com",
        amount: 15000,
        term: 36,
        status: "rejected",
        dateApplied: "2023-05-20",
      },
    ];

    const loan = mockData.find((loan) => loan.id === loanId);
    
    if (!loan) {
      setError("Loan not found");
      setLoading(false);
      return;
    }

    setData(loan);
    setLoading(false); // Simulate network delay
  }, [loanId]);

  return { data, loading, error };
};
  