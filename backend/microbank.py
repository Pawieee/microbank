from datetime import datetime, timedelta
from sqlalchemy import text

# Scoring weights
WEIGHTS = {
    "employment": 0.15,
    "loan_to_salary_ratio": 0.5,
    "repayment_period": 0.1,
    "credit_score": 0.25
}

# Loan Levels
LOAN_LEVELS = {
    1: {"range": (5000, 10000), "interest": 5},
    2: {"range": (10001, 20000), "interest": 8},
    3: {"range": (20001, 30000), "interest": 12},
    4: {"range": (30001, 40000), "interest": 15},
    5: {"range": (40001, 50000), "interest": 18},
}


SCHEDS = {
    "Weekly": 4,
    "Bi-Weekly": 2,
    "Monthly": 1
}

# Helpers
def get_ratio(salary, loan_amount, repayment_period):

    rates = {}
    key_lvl = None
    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= loan_amount <= details["range"][1]:
            key_lvl = level
            rates = details
    total_loan = loan_amount + (loan_amount * (rates['interest'] / 100))
    monthly_payment = total_loan / repayment_period
    print(f"Salary: {salary}, Loan Amount: {loan_amount}, Interest: {rates['interest']}, Total: {total_loan}, Period: {repayment_period}")
    
    res = {"ratio":monthly_payment / salary if salary else float('inf'), "loan_lvl": key_lvl, "total_loan":total_loan}
    return 

def get_credit(score):
    if 300 <= score <= 400:
        return "poor"
    elif 401 <= score <= 600:
        return "average"
    elif 601 <= score <= 800:
        return "good"
    else:
        return "poor"  # fallback


def get_date(months):
    return datetime.today() + timedelta(days=30 * months)

# Scoring System
def calculate_score(applicant):
    scores = {
        "employment": {"unemployed": 3, "self-employed": 6, "employed": 10},
        "loan_to_salary_ratio": {"low": 10, "mid": 6, "high": 2},
        "repayment_period": {"short": 10, "medium": 6, "long": 3},
        "credit_score": {"poor": 3, "average": 6, "good": 10}
    }
    return sum(scores[factor][applicant[factor]] * WEIGHTS[factor] for factor in scores)

def determine_loan_eligibility(applicant):
    score = calculate_score(applicant)
    
    if score < 7:
        return {"status": "Rejected", "reason": "Score too low", "score": score}
    
    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= applicant["loan_requested"] <= details["range"][1]:
            return {
                "status": "Approved",
                "level": level,
                "interest": details["interest"],
                "score": score
            }

    return {"status": "Rejected", "reason": "Loan amount out of range", "score": score}

def first_payment(principal, payment_time_period, interest, payment_schedule):
    total_loan = principal + (principal * interest)

    return total_loan / (payment_time_period * SCHEDS[payment_schedule])


def release_loan(conn, applicant):
    '''Sets the loan release date and initial loan deadline based on repayment period'''

    # query applicant details and loan details

    loan_release_date = datetime.today()
    selfloan_deadline = get_date()
    with conn.connect() as connection:
        applicant_info = connection.execute(
            text(
                """
                SELECT l.applicant_id, l.loan_id, ld.interest_rate, principal, total_loan, payment_time_period, payment_schedule
                FROM applicants a
                LEFT JOIN loans l ON l.applicant_id = a.applicant_id
                LEFT JOIN loan_details ld ON ld.plan_lvl = l.loan_plan_lvl
                WHERE a.first_name = :first_name AND
                        a.last_name = :last_name AND
                        a.middle_name = :middle_name
                """), {
                    "first_name":applicant.first_name,
                    "last_name": applicant.last_name,
                    "middle_name": applicant.middle_name
                }
        ).mappings().fetchone()
        
        connection.execute(
            text("INSERT INTO loan_details (loan_id, due_amount, next_due, amount_payable, is_current) VALUES (:loan_id, :due_amount, :next_due, :amount_payable, :is_current)"), {
                "loan_id": applicant_info['loan_id'],
                "due_amount": first_payment(applicant_info['principal'], applicant_info['payment_time_period'],
                                             applicant_info['interest'], applicant_info['payment_schedule']),
                "next_due": loan_release_date + timedelta(days = 30 if applicant_info['payment_time_period'] == "Monthly" 
                                                          else 15 if applicant_info['payment_time_period'] == "Bi-Weekly"
                                                          else 7),
                "amount_payable": applicant_info['total_loan'],
                "is_current": True
            }
        )

def update_balance(conn, applicant_id, loan_id, payment):
    with conn.connect() as connection:
        # fetch existing loan_detail row first
        # record payment first
        # update existing row in loan_details to False, then insert a new row for current True

        current_loan_status = connection.execute(
            text("SELECT * FROM loan_details WHERE applicant_id = :applicant_id AND is_current = True"), {
                "applicant_id": applicant_id
            }
            ).mappings().fetchone()
        due_amount = current_loan_status['due_amount']

        # Update the next_due here as well, depending on the payment
        # compare as well the due date
        # get how many weeks delayed to get penalty
        days = current_loan_status - datetime.today()

        if datetime.today() <= current_loan_status['next_due']:
            if  payment < due_amount:
                #underpaid
                remarks = "partial?"
                due_amount -= payment
            elif payment > due_amount:
                #overpaid -> common scenario is ma shorten ang remaining months to pay
                # fetch maybe the total amount? then subtract there?
                remarks = "overpaid?"
                instances = payment // due_amount
                due_amount * instances

            else: remarks = "ok"

        connection.execute(
            text("INSERT INTO payments (loan_id, amount_paid, transaction_date, remarks) VALUES (:loan_id, :amount_paid, :transaction_date, :remarks)"), {
                 "loan_id": loan_id,
                 "amount_paid": payment,
                 "transaction_date": datetime.today(),
                 "remarks": remarks
             }
            )
        
        # filter now on what to do based on remarks, dont forget to UPDATE PREVIOUS ROW!

        connection.execute(
            text("INSERT INTO loan_details (loan_id, due_amount, next_due, is_current) VALUES (:loan_id, :due_amount, :next_due, :is_current"), {
                "loan_id": loan_id,
                "due_amount": due_amount,
                "next_due": datetime.today(),
                # loan_release_date + timedelta(days = 30 if applicant_info['payment_time_period'] == "Monthly" 
                #                                           else 15 if applicant_info['payment_time_period'] == "Bi-Weekly"
                #                                           else 7),
                "is_current": True
            }
        )



class Applicant:
    def __init__(self, data):
        self.first_name = data["first_name"]
        self.last_name = data["last_name"]
        self.middle_name = data["middle_name"]
        self.email = data["email"]
        self.phone_num = data["phone_num"]
        
        self.employment_status = data["employment_status"].lower()
        self.loan_amount = int(data["loan_amount"])
        self.monthly_revenue = int(data["monthly_revenue"])
        self.credit_score = get_credit(int(data["credit_score"]))
        
        self.repayment_period = int(data["repayment_period"])
        
        self.salary_to_loan_ratio = get_ratio(self.monthly_revenue, self.loan_amount, self.repayment_period)
        self.application_date = datetime.today()

    def assess_eligibility(self):
        ratio_category = (
            # high-risk if ration > 0.4 actually :*
            "low" if self.salary_to_loan_ratio['ratio'] <= 0.1
            else "mid" if self.salary_to_loan_ratio['ratio'] <= 0.25
            else "high"
        )

        period_category = (
            "short" if self.repayment_period <= 3
            else "medium" if self.repayment_period <= 12
            else "long"
        )

        factors = {
            "employment": self.employment_status,
            "loan_to_salary_ratio": ratio_category,
            "repayment_period": period_category,
            "credit_score": self.credit_score,
            "loan_requested": self.loan_amount
        }

        print(f"Scoring Factors: {factors}")
        return determine_loan_eligibility(factors)

    def load_to_db(self, conn):
        with conn.connect() as connection:
            # Will add check if applicant already exists
            connection.execute(
                text("INSERT INTO applicants (fname, lname, mname, email, contact_num) VALUES (:fname, :lname, :mname, :email, :contact_num)"), {
                    "fname": self.first_name,
                    "lname": self.last_name,
                    "mname": self.middle_name,
                    "email": self.email,
                    "contact_num": self.phone_num
                }
            )
            # query for applicant id
            applicant_id = connection.execute(
                text("SELECT applicant_id FROM applicants WHERE fname = :fname AND lname = :lname AND mname = :mname"), {
                    "fname": self.first_name,
                    "lname": self.last_name,
                    "mname": self.middle_name
                }).mappings().fetchone()['applicant_id']

            connection.execute(
                text("INSERT INTO loans (applicant_id, loan_plan_lvl, principal, total_loan, payment_time_period, application_date, payment_schedule, status) "
            "VALUES (:applicant_id, :loan_plan_lvl, :principal, :total_loan, :payment_time_period, :application_date, :payment_schedule, :status)"), {
                    "applicant_id": applicant_id,
                    "loan_plan_lvl": self.salary_to_loan_ratio['loan_lvl'],
                    "principal": self.loan_amount,
                    "total_amount": self.salary_to_loan_ratio['total_loan'],
                    "payment_time_period": self.repayment_period,
                    "application_date": self.application_date,
                    "payment_schedule": self.weekly,
                    "status": "Pending"
                }
            )


