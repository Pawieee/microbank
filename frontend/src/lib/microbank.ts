/* eslint-disable @typescript-eslint/no-explicit-any */
type EmploymentCategory = "unemployed" | "self-employed" | "employed";
type RatioCategory = "low" | "mid" | "high";
type PeriodCategory = "short" | "medium" | "long";
type CreditScore = "poor" | "fair" | "good" | "excellent";
type PaymentSchedule = "Weekly" | "Bi-Weekly" | "Monthly";

type LoanLevel = {
  range: [number, number];
  interest: number;
};

type ScoringFactors = {
  employment: EmploymentCategory;
  loan_to_salary_ratio: RatioCategory;
  repayment_period: PeriodCategory;
  credit_score: CreditScore;
  loan_requested: number;
};

type EligibilityResult =
  | { status: "Rejected"; reason: string; score: number }
  | { status: "Approved"; level: number; interest: number; score: number };

// Scoring weights
const WEIGHTS = {
  employment: 0.1,
  loan_to_salary_ratio: 0.5,
  repayment_period: 0.15,
  credit_score: 0.25,
} as const;

// Loan level definitions
const LOAN_LEVELS: Record<number, LoanLevel> = {
  1: { range: [5000, 10000], interest: 5 },
  2: { range: [10001, 20000], interest: 8 },
  3: { range: [20001, 30000], interest: 12 },
  4: { range: [30001, 40000], interest: 15 },
  5: { range: [40001, 50000], interest: 18 },
};

const SCORES = {
  employment: {
    unemployed: 3,
    "self-employed": 6,
    employed: 10,
  },
  loan_to_salary_ratio: {
    low: 10,
    mid: 7,
    high: 2,
  },
  repayment_period: {
    short: 10,
    medium: 6,
    long: 3,
  },
  credit_score: {
    poor: 3,
    fair: 6,
    good: 8,
    excellent: 10,
  },
} as const;

// Calculate total weighted score
function calculateScore(applicant: ScoringFactors): number {
  const factors = ["employment", "loan_to_salary_ratio", "repayment_period", "credit_score"] as const;

  return factors.reduce((acc, factor) => {
    const value = applicant[factor] as keyof typeof SCORES[typeof factor];
    const weight = WEIGHTS[factor];
    const rawScore = SCORES[factor][value];
    return acc + rawScore * weight;
  }, 0);
}

// Determine loan approval/rejection based on score and amount
export function determineLoanEligibility(applicant: ScoringFactors): EligibilityResult {
  const score = calculateScore(applicant);

  if (score < 7) {
    return { status: "Rejected", reason: "Score too low", score };
  }

  for (const [levelStr, details] of Object.entries(LOAN_LEVELS)) {
    const level = Number(levelStr);
    const [min, max] = details.range;
    if (applicant.loan_requested >= min && applicant.loan_requested <= max) {
      return { status: "Approved", level, interest: details.interest, score };
    }
  }

  return { status: "Rejected", reason: "Loan amount out of range", score };
}

// Applicant class
export class Applicant {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone_num: string;

  employment_status: EmploymentCategory;
  loan_amount: number;
  monthly_revenue: number;
  credit_score: CreditScore;

  repayment_period: number;
  payment_schedule: PaymentSchedule;

  constructor(data: any) {
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.middle_name = data.middle_name;
    this.email = data.email;
    this.phone_num = data.phone_num;

    this.employment_status = data.employment_status.toLowerCase() as EmploymentCategory;
    this.loan_amount = parseInt(data.loan_amount);
    this.monthly_revenue = parseInt(data.monthly_revenue);
    this.credit_score = data.credit_score as CreditScore;

    this.repayment_period = parseInt(data.repayment_period);
    this.payment_schedule = data.payment_schedule as PaymentSchedule;
  }

  get salary_to_loan_ratio(): { ratio: number } {
    return {
      ratio: this.loan_amount / this.monthly_revenue,
    };
  }

  assess_eligibility(): EligibilityResult {
    const ratio = this.salary_to_loan_ratio.ratio;

    const ratio_category: RatioCategory =
      ratio <= 0.15 ? "low" : ratio <= 0.28 ? "mid" : "high";

    const period_category: PeriodCategory =
      this.repayment_period <= 3
        ? "short"
        : this.repayment_period <= 12
        ? "medium"
        : "long";

    const factors: ScoringFactors = {
      employment: this.employment_status,
      loan_to_salary_ratio: ratio_category,
      repayment_period: period_category,
      credit_score: this.credit_score,
      loan_requested: this.loan_amount,
    };

    console.log("Scoring Factors:", factors);
    return determineLoanEligibility(factors);
  }
}
