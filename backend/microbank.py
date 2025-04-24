from sqlalchemy import text
from datetime import datetime, timedelta

WEIGHTS = {
    "employment": 0.15,
    "loan_to_salary_ratio": 0.5,
    "repayment_period": 0.1,
    "credit_score": 0.25
}

LOAN_LEVELS = {
    1: {"range": (2500, 5000), "interest": 0.05},
    2: {"range": (5001, 10000), "interest": 0.08},
    3: {"range": (10001, 20000), "interest": 0.12},
    4: {"range": (20001, 40000), "interest": 0.15},
    5: {"range": (40001, 60000), "interest": 0.18},
}

def get_ratio(payment, salary):
    return payment / salary

def calculate_score(applicant):
    scores = {
        "employment": {"unemployed": 3, "self-employed": 6, "employed": 10},
        "loan_to_salary_ratio": {"low": 10, "mid": 6, "high": 3},
        "repayment_period": {"short": 10, "medium": 6, "long": 3},
        "credit_score": {"poor": 3, "average": 6, "good": 10}
    }
    total_score = sum(
        scores[factor][applicant[factor]] * WEIGHTS[factor] for factor in applicant if factor != "loan_requested"
    )
    return total_score

def determine_loan_eligibility(applicant):
    score = calculate_score(applicant)
    if score < 7:
        return {"status": "Rejected", "reason": "Score too low", "score": score}
    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= applicant["loan_requested"] <= details["range"][1]:
            return {"status": "Approved", "level": level, "interest": details["interest"], "score": score}
    return {"status": "Rejected", "reason": "Requested loan amount does not match any level", "score": score}

def get_value(num):
    if num <= 0:
        return "low"
    elif num <= 0.5:
        return "mid"
    else:
        return "high"

def get_credit(cred):
    if cred < 400:
        return "poor"
    elif cred < 600:
        return "average"
    else:
        return "good"

def get_period(period):
    if period < 4:
        return "short"
    elif period < 13:
        return "medium"
    else:
        return "long"

def get_date(day_count):
    return datetime.today() + timedelta(days=day_count)

def get_rate(period, loan_amount, loan_lvl):
    total_payable = loan_amount + (loan_amount * LOAN_LEVELS[loan_lvl]['interest'])
    rate = total_payable / period
    return {"total_payable": total_payable, "rate": rate}

def get_payment_rate(applicant):
    return {"period_str": "Weekly", "period_int": applicant.repayment_period * 4} if applicant.period == "Weekly" else {"period_str": "Monthly", "period_int": applicant.repayment_period}

class Applicant:
    def __init__(self, json_struct):
        for key, value in json_struct.items():
            if key == "monthly_revenue":
                setattr(self, key, int(value))
            elif key == "repayment_period":
                setattr(self, key, int(value))
                self.loan_deadline = get_date(int(value))
                self.repayment_period_label = get_period(int(value))
            elif key == "credit_score":
                setattr(self, key, int(value))
                self.credit_score_label = get_credit(value)
            else:
                setattr(self, key, value)
        self.loan_date = datetime.today()

    def assess_eligibity(self):
        loan_lvl = 0
        for level, details in LOAN_LEVELS.items():
            if details["range"][0] <= self.loan_amount <= details["range"][1]:
                loan_lvl = level

        total_payment = self.loan_amount + (self.loan_amount * LOAN_LEVELS[loan_lvl]['interest'])
        ratio = get_ratio(total_payment, self.monthly_revenue)
        ratio_label = get_value(ratio)

        factors = {
            "employment": self.employment_status.lower(),
            "loan_to_salary_ratio": ratio_label,
            "repayment_period": self.repayment_period_label,
            "credit_score": self.credit_score_label,
            "loan_requested": self.loan_amount
        }

        print(factors)
        return determine_loan_eligibility(factors)

    def load_to_db(self, conn):
        with conn.connect() as connection:
            connection.execute(
                text("""
                    INSERT INTO applicants (first_name, middle_initial, last_name, email, phone_num, employment_status, salary, cred_score)
                    VALUES (:fname, :m_init, :lname, :email, :phone, :emp_stat, :salary, :cred_score)
                """),
                {
                    "fname": self.first_name,
                    "m_init": self.middle_initial,
                    "lname": self.last_name,
                    "email": self.email,
                    "phone": self.phone_num,
                    "emp_stat": self.employment_status,
                    "salary": self.monthly_revenue,
                    "cred_score": self.credit_score
                }
            )
            print("Applicant added to DB.")
