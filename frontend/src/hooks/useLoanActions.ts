// src/hooks/useLoanActions.ts
import { useState } from "react";
import { postRejection } from "@/api/loans";

interface ActionResponse {
  success: boolean;
  message?: string;
}

export function useLoanActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectLoan = async (loanId: string, reason: string): Promise<ActionResponse> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await postRejection(loanId, reason);
      return { success: true, message: result.message };
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    rejectLoan,
    isProcessing,
    error,
  };
}