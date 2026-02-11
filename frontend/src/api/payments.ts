// src/api/payments.ts
import { PaymentPayload } from "@/types/payments";

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