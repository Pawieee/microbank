export interface DailyApplicantData {
    date: string;
    applicant_count: number;
}

export interface ChartData {
    name: string;
    value: number;
}

export interface DashboardStats {
    approved_loans: number;
    pending_loans: number;
    settled_loans: number;
    rejected_loans: number;
    total_disbursed: number;
    total_payments: number;
    net_revenue: number;
    daily_applicant_data: DailyApplicantData[];
    loan_purpose_data: ChartData[];
    demographic_data: ChartData[];
}