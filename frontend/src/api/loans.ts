/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/loans.ts
import { EligibilityResponse, SubmissionResponse, DisbursePayload } from "@/types/loans";

export async function checkLoanEligibility(formData: any): Promise<EligibilityResponse> {
    const payload = { ...formData, date_of_birth: formData.date_of_birth instanceof Date ? formData.date_of_birth.toISOString() : formData.date_of_birth };
    const res = await fetch("/api/check-eligibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Eligibility check failed");
    return data;
}

export async function submitLoanApplication(formData: any, creditScore: number): Promise<SubmissionResponse> {
    const payload = { ...formData, date_of_birth: formData.date_of_birth instanceof Date ? formData.date_of_birth.toISOString() : formData.date_of_birth, credit_score: creditScore };
    const res = await fetch("/api/loan-status-notification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Application submission failed");
    return data;
}

export async function postDisbursement(payload: DisbursePayload) {
    const res = await fetch("/api/loans/disburse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Disbursement failed");
    return data;
}

export async function postRejection(loanId: string, remarks: string) {
    const res = await fetch("/api/loans/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loan_id: loanId, remarks }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Rejection failed");
    return data;
}

export async function postApproval(loanId: string) {
    const res = await fetch('/api/loans/approve-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loan_id: loanId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Approval failed");
    return data;
}

export async function postPrintLog(loanId: string) {
    const res = await fetch("/api/loans/log-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: loanId, action: "PRINT_AGREEMENT" }),
    });

    if (!res.ok) {
        console.error("Failed to log print action");
    }
    return { success: true };
}