// src/hooks/useLoanRelease.ts
import { useState, useCallback } from "react";
import useSWR from "swr";
import { format } from "date-fns";

// ✅ Imports from new structure
import { LoanDetails } from "@/types/loans";
import { 
  postDisbursement, 
  postRejection, 
  postApproval, 
  postPrintLog 
} from "@/api/loans";

export type ProcessStage = 'idle' | 'connecting' | 'transferring' | 'finalizing';

export function useLoanRelease(loanId: string) {
  // 1. SWR Fetching (Replaces useEffect)
  // We use the same key as useLoanDetails so they share the cache!
  const { data: details, error, isLoading, mutate } = useSWR<LoanDetails>(
    loanId ? `/api/loans/${loanId}` : null
  );

  const [processStage, setProcessStage] = useState<ProcessStage>('idle');

  // 2. Disbursement Action
  const processDisbursement = useCallback(async (applicantId: number, email: string) => {
    try {
      setProcessStage('connecting');
      await new Promise(r => setTimeout(r, 1500));
      setProcessStage('transferring');
      await new Promise(r => setTimeout(r, 2000));
      setProcessStage('finalizing');
      await new Promise(r => setTimeout(r, 1000));

      await postDisbursement({
        applicant_id: applicantId,
        loan_id: loanId,
        email: email,
        release_date: format(new Date(), "yyyy-MM-dd"),
      });

      mutate(); // Refresh data to show "Active" status
      return { success: true };
    } catch (err: any) {
      setProcessStage('idle');
      return { success: false, message: err.message };
    }
  }, [loanId, mutate]);

  // 3. Rejection Action
  const processRejection = useCallback(async (reason: string) => {
    try {
      await postRejection(loanId, reason);
      mutate(); // Refresh data to show "Rejected" status
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [loanId, mutate]);

  // 4. Approval Action
  const processApproval = async () => {
    try {
      await postApproval(loanId);
      // Optimistic update or just re-fetch
      mutate(); 
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // 5. Print Log Action
  const processPrintLog = useCallback(async () => {
    try {
      await postPrintLog(loanId);
    } catch (err) {
      console.error("Audit Error:", err);
    }
  }, [loanId]);

  return {
    details: details || null,
    loading: isLoading,
    error: error ? error.message : null,
    processStage,
    processDisbursement,
    processRejection,
    processApproval,
    processPrintLog 
  };
}