from datetime import datetime, timedelta
from sqlalchemy import text

# Scoring weights
WEIGHTS = {
    "employment": 0.1,
    "loan_to_salary_ratio": 0.5,
    "repayment_period": 0.15,
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
def get_ratio(salary, loan_amount, repayment_period, schedule):

    rates = {}
    key_lvl = None
    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= loan_amount <= details["range"][1]:
            key_lvl = level
            rates = details
    total_loan = loan_amount + (loan_amount * (rates['interest'] / 100))
    monthly_payment = total_loan / repayment_period * SCHEDS[schedule]
    print(f"Salary: {salary}, Monthly Payment: {monthly_payment}, Loan Amount: {loan_amount}, Interest: {rates['interest']}, Total: {total_loan}, Period: {repayment_period}")
    
    res = {"ratio":monthly_payment / salary if salary else float('inf'), "loan_lvl": key_lvl, "total_loan":total_loan, "monthly_payment": monthly_payment}
    return res

# Scoring System
def calculate_score(applicant):
    scores = {
        "employment": {"unemployed": 3, "self-employed": 6, "employed": 10},
        "loan_to_salary_ratio": {"low": 10, "mid": 7, "high": 2},
        "repayment_period": {"short": 10, "medium": 6, "long": 3},
        "credit_score": {"poor": 3, "fair": 6, "good":8, "excellent": 10}
    }
    scoresdx = [scores[factor][applicant[factor]] * WEIGHTS[factor] for factor in scores]
    print(scoresdx)
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

def compute_payment_amount(principal, payment_time_period, interest, payment_schedule):
    total_loan = principal + (principal * interest)
    return round(total_loan / (payment_time_period * SCHEDS[payment_schedule]), 2)


def release_loan(conn, applicant_id, loan_id):
    '''Sets the loan release date and initial loan deadline based on repayment period'''

    loan_release_date = datetime.today()
    with conn.connect() as connection:
        applicant_info = connection.execute(
            text(
                """
                SELECT l.applicant_id, l.loan_id, ld.interest_rate, principal, total_loan, payment_time_period, payment_schedule
                FROM applicants a
                LEFT JOIN loans l ON l.applicant_id = a.applicant_id
                LEFT JOIN loan_details ld ON ld.plan_lvl = l.loan_plan_lvl
                WHERE l.loan_id = :loan_id AND
                        a.applicant_id = :applicant_id
                """
            ), {
                "loan_id": loan_id,
                "applicant_id": applicant_id,
            }
        ).mappings().fetchone()

        due_amount = compute_payment_amount(
            applicant_info['principal'],
            applicant_info['payment_time_period'],
            applicant_info['interest_rate'],
            applicant_info['payment_schedule']
        )

        total_payments = applicant_info['payment_time_period'] * SCHEDS[applicant_info['payment_schedule']]

        connection.execute(
            text(
                "INSERT INTO loan_details (loan_id, due_amount, next_due, amount_payable, payments_remaining, is_current) "
                "VALUES (:loan_id, :due_amount, :next_due, :amount_payable, :payments_remaining, :is_current)"
            ), {
                "loan_id": applicant_info['loan_id'],
                "due_amount": due_amount,
                "next_due": loan_release_date + timedelta(
                    days=30 if applicant_info['payment_schedule'] == "Monthly"
                    else 15 if applicant_info['payment_schedule'] == "Bi-Weekly"
                    else 7
                ),
                "amount_payable": applicant_info['total_loan'],
                "payments_remaining": total_payments,
                "is_current": 1
            }
        )

        connection.commit()

def update_balance(conn, applicant_id, loan_id, payment):
    with conn.connect() as connection:
        try:
            # Step 1: Fetch loan info
            loan_info = connection.execute(
                text("SELECT * FROM loans WHERE applicant_id = :applicant_id AND status = :status"),
                {"applicant_id": applicant_id, "status": "Ongoing"}
            ).mappings().fetchone()

            current_loan_status = connection.execute(
                text("SELECT * FROM loan_details WHERE loan_id = :loan_id AND is_current = 1"),
                {"loan_id": loan_id}
            ).mappings().fetchone()

            if not current_loan_status:
                raise Exception("No active loan detail found.")

            # Step 2: Deactivate old loan detail
            connection.execute(
                text("UPDATE loan_details SET is_current = 0 WHERE loan_detail_id = :loan_detail_id"),
                {"loan_detail_id": current_loan_status['loan_detail_id']}
            )

            # Step 3: Setup initial values
            scheduled_amount = loan_info['payment_amount']  # payment per schedule
            due_amount = current_loan_status['due_amount']
            due_date = current_loan_status['next_due']
            payment_schedule = loan_info['payment_schedule']
            instances = current_loan_status['payments_remaining']
            amount_payable = current_loan_status['amount_payable']

            today = datetime.today()
            remarks = ""

            # Step 4: Handle missed payments (if overdue)
            penalty_rate = 0.10  # 10% penalty per missed interval
            missed_intervals = 0

            if today > due_date:
                # Calculate how many schedules were missed
                days_late = (today - due_date).days
                if payment_schedule == "Weekly":
                    missed_intervals = days_late // 7
                    interval_days = 7
                elif payment_schedule == "Bi-Weekly":
                    missed_intervals = days_late // 15
                    interval_days = 15
                else:  # Assume Monthly
                    missed_intervals = days_late // 30
                    interval_days = 30

                # Compute total penalty
                total_penalty = missed_intervals * (scheduled_amount * penalty_rate)

                # Add missed scheduled payments + penalties
                due_amount += (missed_intervals * scheduled_amount) + total_penalty
                due_date += timedelta(days=interval_days * (missed_intervals + 1))  # Move due date forward

            else:
                # If not overdue, move the due date normally
                if payment_schedule == "Weekly":
                    interval_days = 7
                elif payment_schedule == "Bi-Weekly":
                    interval_days = 15
                else:  # Assume Monthly
                    interval_days = 30
                due_date += timedelta(days=interval_days)

            # Step 5: Handle payment applied to current due
            if payment >= due_amount:
                # Full payment or advance
                payment_left = payment - due_amount
                amount_payable -= payment
                instances -= 1
                due_amount = scheduled_amount  # reset to default per schedule
                remarks = "Paid in full"

                # Apply advance payments to future schedules if possible
                while payment_left >= scheduled_amount and instances > 0:
                    payment_left -= scheduled_amount
                    amount_payable -= scheduled_amount
                    instances -= 1
                    due_date += timedelta(days=interval_days)

            else:
                # Partial payment
                due_amount -= payment
                amount_payable -= payment
                remarks = "Partial payment"

            # Step 6: Insert new loan_details record
            connection.execute(
                text("""
                    INSERT INTO loan_details (loan_id, due_amount, next_due, amount_payable, payments_remaining, is_current)
                    VALUES (:loan_id, :due_amount, :next_due, :amount_payable, :payments_remaining, :is_current)
                """),
                {
                    "loan_id": loan_id,
                    "due_amount": due_amount,
                    "next_due": due_date,
                    "amount_payable": amount_payable,
                    "payments_remaining": instances,
                    "is_current": 1
                }
            )

            # Step 7: Record the payment
            connection.execute(
                text("""
                    INSERT INTO payments (loan_id, amount_paid, transaction_date, remarks)
                    VALUES (:loan_id, :amount_paid, :transaction_date, :remarks)
                """),
                {
                    "loan_id": loan_id,
                    "amount_paid": payment,
                    "transaction_date": today,
                    "remarks": remarks
                }
            )

            connection.commit()
            print("Payment recorded successfully.")

        except Exception as e:
            print(f"Error updating balance: {e}")
            connection.rollback()


def fetch_transactions(conn, applicant_id):
    with conn.connect() as connection:
        try:
            transactions = connection.execute(
                text(
                    '''
                    SELECT
                        p.loan_id, amount_paid, remarks, transaction_date
                    FROM payments p
                    LEFT JOIN loans l ON l.loan_id = p.loan_id
                    LEFT JOIN applicants a ON a.applicant_id = l.loan_id
                    WHERE a.applicant_id = :applicant_id
                    '''), {
                        "applicant_id": applicant_id
                    }
            ).mappings().fetchall()

            return dict(transactions)
        except Exception as e:
            print(f"Error fetching transactions: {e}")



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
        self.credit_score = data["credit_score"]
        
        self.repayment_period = int(data["repayment_period"])
        self.payment_schedule = data["payment_schedule"]
        
        self.salary_to_loan_ratio = get_ratio(self.monthly_revenue, self.loan_amount, self.repayment_period, self.payment_schedule)
        self.application_date = datetime.today()

    def assess_eligibility(self):
        ratio_category = (
            # high-risk if ration > 0.4 actually :*
            "low" if self.salary_to_loan_ratio['ratio'] <= 0.15
            else "mid" if self.salary_to_loan_ratio['ratio'] <= 0.28
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
        try:
            with conn.connect() as connection:
                # Will add check if applicant already exists
                connection.execute(
                    text("INSERT INTO applicants (first_name, last_name, middle_name, email, phone_num, employment_status, salary, credit_score) " \
                    "VALUES (:first_name, :last_name, :middle_name, :email, :phone_num, :employment_status, :salary, :credit_score)"), {
                        "first_name": self.first_name,
                        "last_name": self.last_name,
                        "middle_name": self.middle_name,
                        "email": self.email,
                        "phone_num": self.phone_num,
                        "employment_status": self.employment_status,
                        "salary": self.monthly_revenue,
                        "credit_score": self.credit_score
                    }
                )
                # query for applicant id
                applicant_id = connection.execute(
                    text("SELECT applicant_id FROM applicants WHERE first_name = :first_name AND last_name = :last_name AND middle_name = :middle_name"), {
                        "first_name": self.first_name,
                        "last_name": self.last_name,
                        "middle_name": self.middle_name
                    }).mappings().fetchone()['applicant_id']

                connection.execute(
                    text("INSERT INTO loans (applicant_id, loan_plan_lvl, principal, total_loan, payment_amount, application_date, payment_start_date, payment_time_period, payment_schedule, status) "
                "VALUES (:applicant_id, :loan_plan_lvl, :principal, :total_loan, :payment_amount, :application_date, :payment_start_date, :payment_time_period, :payment_schedule, :status)"), {
                        "applicant_id": applicant_id,
                        "loan_plan_lvl": self.salary_to_loan_ratio['loan_lvl'],
                        "principal": self.loan_amount,
                        "total_loan": self.salary_to_loan_ratio['total_loan'],
                        "payment_amount": self.salary_to_loan_ratio['monthly_payment'],
                        "application_date": self.application_date,
                        "payment_start_date": None,
                        "payment_time_period": self.repayment_period,
                        "payment_schedule": self.payment_schedule,
                        "status": "Pending"
                    }
                )

                connection.commit()
        except Exception as e:
            print(f"Error occurred: {e}")


