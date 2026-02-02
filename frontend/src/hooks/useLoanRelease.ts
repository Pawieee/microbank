// src/hooks/useLoanRelease.ts
import { useState, useEffect, useCallback } from "react";
import { getLoanDetails, postDisbursement, postRejection, LoanDetails } from "@/lib/api/loans";
import { format } from "date-fns";

export type ProcessStage = 'idle' | 'connecting' | 'transferring' | 'finalizing';

export function useLoanRelease(loanId: string) {
  const [details, setDetails] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processStage, setProcessStage] = useState<ProcessStage>('idle');
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Details on Mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getLoanDetails(loanId);
        if (mounted) setDetails(data);
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [loanId]);

  // 2. Disbursement Logic (with Mock Animation)
  const processDisbursement = useCallback(async (applicantId: number, email: string) => {
    setError(null);
    try {
      // Mock Animation Sequence
      setProcessStage('connecting');
      await new Promise(r => setTimeout(r, 1500));
      setProcessStage('transferring');
      await new Promise(r => setTimeout(r, 2000));
      setProcessStage('finalizing');
      await new Promise(r => setTimeout(r, 1000));

      // Actual API Call
      await postDisbursement({
        applicant_id: applicantId,
        loan_id: loanId,
        email: email,
        release_date: format(new Date(), "yyyy-MM-dd"),
      });

      return { success: true };
    } catch (err: any) {
      setProcessStage('idle');
      return { success: false, message: err.message };
    }
  }, [loanId]);

  // 3. Rejection Logic
  const processRejection = useCallback(async (reason: string) => {
    try {
      await postRejection(loanId, reason);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [loanId]);

  const processApproval = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans/approve-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loan_id: loanId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // FIX: Check if prev exists before returning the new state
      setDetails((prev) => {
        if (!prev) return null; // If state is null, keep it null
        return { ...prev, status: 'For Release' }; // Safely update status
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    details,
    loading,
    error,
    processStage,
    processDisbursement,
    processRejection,
    processApproval
  };
}

