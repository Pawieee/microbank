// src/types/loans.ts

// ==========================================
// 1. SHARED DATA
// ==========================================

export interface BaseLoanData {
  loan_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  status: string;
  date_applied: string;
  start_date?: string;
  duration: number;
  principal: number;
  amount: number;
  interest_rate: number;
  credit_score: number | string;
  monthly_income: number;
  employment_status: string;
  gender: string;
  civil_status: string;
  address: string;
  phone_num?: string;
  phone_number?: string;
  id_type: string;
  id_image_data: string;
  loan_purpose: string;
  payment_schedule: string;
  disbursement_method: string;
  disbursement_account_number?: string;
}

// ==========================================
// 2. SPECIFIC VIEWS
// ==========================================

export interface Loan extends BaseLoanData {
  balance: number;
  due_amount: number;
  next_due?: string;
}

export interface LoanDetails extends BaseLoanData {
  remarks?: string;
  balance?: number;
  due_amount?: number;
  next_due?: string;
}

export interface LoanOffer {
  credit_score: number;
  interest_rate: number;
  principal: number;
  total_repayment: number;
  payment_amount: number;
  payment_count: number;
  schedule: string;
}

// ==========================================
// 3. RESPONSES & PAYLOADS
// ==========================================

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