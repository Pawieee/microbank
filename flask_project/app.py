from flask import Flask, request, render_template

# Scoring weights
WEIGHTS = {
    "employment": 0.15,  # Less weight than salary
    "salary": 0.3,       # Most important
    "debt": 0.2,         # High negative impact
    "loan_amount": 0.15, # Moderate weight
    "repayment_period": 0.1,  # Minor influence
    "credit_history": 0.1      # Slight influence
}

# Loan Levels
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
        "debt": {"high": 3, "moderate": 6, "none": 10},
        "loan_amount": {"low": 10, "moderate": 6, "high": 3},
        "repayment_period": {"short": 10, "medium": 6, "long": 3},
        "credit_history": {"poor": 3, "average": 6, "good": 10}
    }

    # Compute weighted score
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

# Simulated Applicants
applicants = [
    {"employment": "unemployed", "salary": "low", "debt": "none", "loan_amount": "moderate", "repayment_period": "medium", "credit_history": "average", "loan_requested": 8000},  # Person A
    {"employment": "employed", "salary": "mid", "debt": "moderate", "loan_amount": "moderate", "repayment_period": "medium", "credit_history": "good", "loan_requested": 10000},  # Person B
    {"employment": "employed", "salary": "high", "debt": "high", "loan_amount": "moderate", "repayment_period": "long", "credit_history": "average", "loan_requested": 15000},   # Person C
     {"employment": "employed", "salary": "high", "debt": "none", "loan_amount": "low", "repayment_period": "short", "credit_history": "average", "loan_requested": 15000}   # Person C
]

# Run Simulation
for idx, applicant in enumerate(applicants, start=1):
    result = determine_loan_eligibility(applicant)
    print(f"Applicant {idx}: {result}")

