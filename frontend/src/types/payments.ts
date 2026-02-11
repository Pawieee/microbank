// src/types/payments.ts

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