export interface Payment {
  payment_id: string;
  amount_paid: number;
  remarks: string;
  transaction_date: string;
}

export interface PaymentResponse {
  payments: Payment[];
  total_paid: number;
}

export async function fetchPaymentsByLoanId(loanId: number): Promise<PaymentResponse> {
  const res = await fetch(`/api/payments/${loanId}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch payments");
  }

  return res.json();
}
