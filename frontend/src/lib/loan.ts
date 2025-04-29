// lib/api/loan.ts
import { ApplicationDetails } from "../hooks/useApplication";

export async function getLoanById(id: string): Promise<ApplicationDetails> {
  const response = await fetch(`/api/loans/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Loan not found");
  }

  return await response.json();
}
