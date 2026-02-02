// src/lib/api/payments.ts

// --- TYPES ---

export interface PaymentRecord {
  payment_id: string;
  amount_paid: number;
  remarks: string;
  transaction_date: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  total_paid: number;
}

export interface PaymentPayload {
  loan_id: number;
  applicant_id: number;
  amount: number;
}

// --- API FUNCTIONS ---

// 1. Get Payment History (Merged from payment-records.ts)
export async function getPaymentHistory(loanId: number): Promise<PaymentHistoryResponse> {
  const res = await fetch(`/api/payments/${loanId}`, { 
    credentials: "include" 
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch payment history");
  }
  
  return res.json();
}

// 2. Post New Payment (Merged from payments.ts)
export async function postPayment(payload: PaymentPayload) {
  const res = await fetch("/api/loans/payment", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Payment transaction failed");
  }
  
  return data;
}