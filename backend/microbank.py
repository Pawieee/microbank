from sqlalchemy import text
from datetime import datetime
WEIGHTS = {
    "employment": 0.15,  # Less weight than salary
    "salary": 0.3,       # Most important
    "debt": 0.2,         # High negative impact, maybe remove???
    "loan_amount": 0.15, # Moderate weight
    "repayment_period": 0.1,  # Minor influence
    "credit_history": 0.1      # Slight influence
}

LOAN_LEVELS = {
    1: {"range": (2500, 5000), "interest": 5},
    2: {"range": (5001, 10000), "interest": 8},
    3: {"range": (10001, 20000), "interest": 12},
    4: {"range": (20001, 40000), "interest": 15},
    5: {"range": (40001, 60000), "interest": 18},
}

def calculate_score(applicant):
    """Calculate the loan eligibility score."""
    scores = {
        "employment": {"unemployed": 3, "self-employed": 6, "employed": 10},
        "salary": {"low": 3, "mid": 6, "high": 10},
        "debt": {"high": 2, "moderate": 4, "low":7, "none": 10},
        "loan_amount": {"low": 10, "moderate": 6, "high": 3},
        "repayment_period": {"short": 10, "medium": 6, "long": 3},
        "credit_history": {"poor": 3, "average": 6, "good": 10}
    }
    total_score = sum(
        scores[factor][applicant[factor]] * WEIGHTS[factor] for factor in applicant if factor != "loan_requested"
    )

    return total_score

def determine_loan_eligibility(applicant):
    """Check if applicant is eligible and assign loan level."""
    score = calculate_score(applicant)
    
    if score < 7:
        return {"status": "Rejected", "reason": "Score too low", "score": score}
    
    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= applicant["loan_requested"] <= details["range"][1]:
            return {"status": "Approved", "level": level, "interest": details["interest"], "score": score}
    
    return {"status": "Rejected", "reason": "Requested loan amount does not match any level", "score": score}

def get_value(num):
    salary_levels = [
        {"range": (5000, 10000), "value": "low"},
        {"range": (10001, 25000), "value": "mid"},
        {"range": (25001, 50000), "value": "high"}
        ]
    for level, details in salary_levels.items():
        if details["range"][0] <= num <= details["range"][1]:
            return details["value"]
    

def get_date(day_count):
    return datetime.date.today() + datetime.timedelta(days=day_count)

# def get_payment_rate(payment_option):

#IMPLEMENT SCD2
    # if payment_option == "Weekly":

# Simulated Applicants
# applicants = [
#     {"employment": "unemployed", "salary": "low", "debt": "none", "loan_amount": "moderate", "repayment_period": "medium", "credit_history": "average", "loan_requested": 8000},  # Person A
#     {"employment": "employed", "salary": "mid", "debt": "moderate", "loan_amount": "moderate", "repayment_period": "medium", "credit_history": "good", "loan_requested": 10000},  # Person B
#     {"employment": "employed", "salary": "high", "debt": "high", "loan_amount": "moderate", "repayment_period": "long", "credit_history": "average", "loan_requested": 15000},   # Person C
#      {"employment": "employed", "salary": "high", "debt": "none", "loan_amount": "low", "repayment_period": "short", "credit_history": "average", "loan_requested": 15000}   # Person C
# ]

# # Run Simulation
# for idx, applicant in enumerate(applicants, start=1):
#     result = determine_loan_eligibility(applicant)
#     print(f"Applicant {idx}: {result}")

class Applicant:
    # employment, loan_amount, loan_purpose, monthly_revenue, cred_score, personal_infos(name, email, contact no., etc), repayment_period
    def __init__(self, json_struct):
        for key, value in json_struct.items():
            if key == "monthly_revenue":
                self.key = get_value(json_struct[key])
            elif key == "repayment_period":
                self.key = get_date(json_struct[key])
            else:
                self.key = value
        self.loan_lvl = get_value(json_struct["loan_amount"])
        self.loan_date = datetime.date.today()


    def assess_eligibity(self):
        factors = {"employment": self.employment, "salary": self.salary, "loan_amount": self.loan_lvl,
                    "repayment_period": self.repayment_period, "credit_history": self.cred_score}
        return determine_loan_eligibility(factors)
    
    def load_to_db(self, conn):

        # get payment rate
        with conn.connect() as connection:
            connection.execute(
                text("INSERT INTO applicants VALUES (:username, :email, :contact_num)"),
                {"username": self.username, "email":self.email, "contact_num":self.contact_num})
            
            user_id = connection.execute(
                text("SELECT applicant_id FROM applicants WHERE fname = :fname AND lname = :lname"),
                {"fname": self.fname, "lname": self.lname})
        return None
