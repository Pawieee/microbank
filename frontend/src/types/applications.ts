// src/lib/api/applications.ts

export interface Application {
  loan_id: number;
  applicant_name: string;
  applicant_id: number;
  email: string;
  start_date: string;
  duration: number;
  principal: number; // Raw amount from DB
  amount: number;    // Total loan amount
  status: string;
  date_applied: string;
  
  // Financials & Risk
  credit_score: number | string;
  monthly_income: number;
  employment_status: string;
  
  // Loan Config
  loan_purpose: string;
  payment_schedule: string;
  term?: number; // Optional, might be alias for duration
  interest_rate?: number;

  // Identity & KYC
  gender: string;
  civil_status: string;
  id_type: string;
  id_image_data: string;
  phone_num: string;
  address: string;
  
  // Disbursement
  disbursement_method: string;
  disbursement_account_number: string;
  
  // Added from SQL query
  remarks?: string; 
  due_amount?: number;
}