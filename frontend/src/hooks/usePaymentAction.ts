import { useState, useMemo } from "react";
import { postPayment } from "@/api/payments";
import { useAlert } from "@/context/alert-context";

interface UsePaymentActionProps {
  loan_id: number;
  applicant_id: number;
  dueAmount: number;
  leftToPaid: number;
  onSuccess?: () => void;
}

export function usePaymentAction({
  loan_id,
  applicant_id,
  dueAmount,
  leftToPaid,
  onSuccess
}: UsePaymentActionProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { triggerAlert } = useAlert();

  // 1. Calculations
  const cleanLeftToPaid = useMemo(() => parseFloat(leftToPaid.toFixed(2)), [leftToPaid]);
  
  // Logic: If remaining balance is smaller than the monthly due, the "Due" is just the remainder.
  const effectiveDue = useMemo(() => (leftToPaid < dueAmount ? leftToPaid : dueAmount), [leftToPaid, dueAmount]);
  
  const val = parseFloat(amount);
  const isOverLimit = val > cleanLeftToPaid;

  // 2. Determine Payment Type Label
  const paymentType = useMemo(() => {
    if (!val || isNaN(val)) return null;
    if (val >= cleanLeftToPaid && !isOverLimit) return "Full Settlement";
    if (val > effectiveDue) return "Advance Payment";
    if (Math.abs(val - effectiveDue) < 0.01) return "Exact Due";
    return "Partial Payment";
  }, [val, cleanLeftToPaid, isOverLimit, effectiveDue]);

  // 3. Reset Form on Open
  const handleOpenChange = (state: boolean) => {
    setOpen(state);
    if (state) {
      setAmount("");
    }
  };

  // 4. Submit Logic
  const handleSubmit = async () => {
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0 || payAmount > cleanLeftToPaid) return;

    setLoading(true);
    try {
      await postPayment({
        loan_id,
        applicant_id,
        amount: payAmount
      });

      triggerAlert({
        title: "Success",
        description: `Payment of ₱${payAmount.toLocaleString()} recorded.`,
        variant: "success",
      });

      setOpen(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      triggerAlert({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    open,
    setOpen: handleOpenChange,
    amount,
    setAmount,
    loading,
    paymentType,
    effectiveDue,
    cleanLeftToPaid,
    isOverLimit,
    handleSubmit
  };
}