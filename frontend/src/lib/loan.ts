import { LoanDetails } from "@/hooks/useLoanDetails"; // Adjust import path as needed

export async function getLoanById(loan_id: string): Promise<LoanDetails> {
  const response = await fetch(`/api/loans/${loan_id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    // FIX: specific error messages based on status code
    if (response.status === 403) {
      throw new Error("403 Forbidden");
    }
    if (response.status === 404) {
      throw new Error("404 Not Found");
    }
    throw new Error("An error occurred while fetching loan details");
  }

  return await response.json();
}