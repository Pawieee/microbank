import { useState } from "react";

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
      const response = await fetch("/api/loans/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: loanId, remarks: reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reject application");
      }

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