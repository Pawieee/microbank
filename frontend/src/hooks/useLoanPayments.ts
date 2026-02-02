import { useState, useEffect, useCallback } from "react";
import { getPaymentHistory, PaymentRecord } from "@/lib/api/payments"; // Updated import

export function useLoanPayments(loanId: number) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!loanId) return;
    
    setLoading(true);
    try {
      const result = await getPaymentHistory(loanId);
      setPayments(result.payments);
      setTotalPaid(result.total_paid);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { 
    payments, 
    totalPaid, 
    loading, 
    refreshPayments: fetchHistory 
  };
}