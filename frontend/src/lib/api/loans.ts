// src/lib/api/loans.ts

// ==========================================
// 1. SHARED TYPES
// ==========================================

export interface BaseLoanData {
  // Identifiers
  loan_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  
  // Status & Time
  status: string;
  date_applied: string;
  start_date?: string; 
  duration: number;    
  
  // Core Financials
  principal: number;   
  amount: number;      
  interest_rate: number;

  // Borrower Profile
  credit_score: number | string;
  monthly_income: number;
  employment_status: string;
  gender: string;
  civil_status: string;
  address: string;
  
  // Contact 
  phone_num?: string; 
  phone_number?: string; 

  // Identity
  id_type: string;
  id_image_data: string;

  // Configuration
  loan_purpose: string;
  payment_schedule: string;
  disbursement_method: string;
  disbursement_account_number?: string;
}

// ==========================================
// 2. SPECIFIC TYPES
// ==========================================

// List View
export interface Loan extends BaseLoanData {
  balance: number;       
  due_amount: number;    
  next_due?: string;      
}

// Single View (Updated to include Ledger Data)
export interface LoanDetails extends BaseLoanData {
  remarks?: string;
  
  // --- ADDED THESE FIELDS TO FIX YOUR ERROR ---
  balance?: number;       
  due_amount?: number;    
  next_due?: string;      
}

// ... (Rest of the file: LoanOffer, payloads, and API functions remain the same) ...

export interface LoanOffer {
  credit_score: number;
  interest_rate: number;
  principal: number;
  total_repayment: number;
  payment_amount: number;
  payment_count: number;
  schedule: string;
}

export interface EligibilityResponse {
  status: "Approved" | "Rejected";
  offer?: LoanOffer;
  credit_score?: number;
  reason?: string;
  message?: string;
}

export interface SubmissionResponse {
  status: string; 
  message?: string;
}

export interface DisbursePayload {
  applicant_id: number;
  loan_id: string;
  email: string;
  release_date: string;
}

// ... (API Functions remain unchanged) ...
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

export async function getLoansList(signal?: AbortSignal): Promise<Loan[]> {
  const res = await fetch(`/api/loans`, { credentials: "include", signal });
  if (res.status === 403) throw new Error("Permission denied");
  if (!res.ok) throw new Error("Failed to fetch loans");
  return res.json();
}

export async function getLoanDetails(id: string): Promise<LoanDetails> {
  const res = await fetch(`/api/loans/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load loan details");
  return res.json();
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