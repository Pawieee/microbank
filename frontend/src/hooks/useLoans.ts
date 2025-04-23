// useLoans.ts
import { useEffect, useState } from "react";

type Loan = {
  id: string;
  applicantName: string;
  email: string;
  amount: number;
  term: number;
  status: "pending" | "approved" | "rejected";
  dateApplied: string;
};

export const useLoans = () => {
  const [data, setData] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data with mock data
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

    setData(mockData);
    setLoading(false); // Simulate network delay
  }, []);

  return { data, loading, error };
};
