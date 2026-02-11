// src/hooks/useLoanForm.ts
import { useState } from "react";
// ✅ Import from new structure
import { checkLoanEligibility, submitLoanApplication } from "@/api/loans";
import { LoanOffer } from "@/types/loans";

export function useLoanForm() {
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<LoanOffer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // STEP 1: CHECK ELIGIBILITY
  const checkEligibility = async (formData: any) => {
    setLoading(true);
    setError(null);
    setOffer(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // UX Delay
      const result = await checkLoanEligibility(formData);

      if (result.status === "Approved" && result.offer) {
        setOffer(result.offer);
        return { success: true, offer: result.offer, credit_score: result.credit_score };
      } else {
        return { success: false, message: result.reason || "Application Rejected" };
      }

    } catch (err: any) {
      const msg = err.message || "System error during eligibility check";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: CONFIRM SUBMISSION
  const submitApplication = async (formData: any, creditScore: number) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // UX Delay
      const result = await submitLoanApplication(formData, creditScore);
      return { success: true, status: result.status };

    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setOffer(null);
    setError(null);
  };

  return {
    loading,
    error,
    offer,
    checkEligibility,
    submitApplication,
    resetFormState
  };
}