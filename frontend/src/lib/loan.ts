// lib/api/loan.ts
import { LoanDetailsProps } from "../hooks/useLoan";

export async function getLoanById(id: string): Promise<LoanDetailsProps> {
  const response = await fetch(`/api/loans/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Loan not found");
  }

  return await response.json();
}
