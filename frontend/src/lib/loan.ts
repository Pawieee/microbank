import { LoanDetails } from "../hooks/useLoanDetails";

export async function getLoanById(loan_id: string): Promise<LoanDetails> {
  const response = await fetch(`/api/loans/${loan_id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Loan not found");
  }

  return await response.json();
}
