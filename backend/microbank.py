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
    monthly_payment = total_loan / (repayment_period)
    print(f"Salary: {salary}, Monthly Payment: {monthly_payment}, Loan Amount: {loan_amount}, Interest: {rates['interest']}, Total: {total_loan}, Period: {repayment_period}")
    
    res = {"ratio":monthly_payment / salary if salary else float('inf'), "loan_lvl": key_lvl, "total_loan":total_loan, "monthly_payment": round(total_loan / (repayment_period * SCHEDS[schedule]), 2)}
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
    total_loan = principal + (principal * (interest / 100))
    return round(total_loan / (payment_time_period * SCHEDS[payment_schedule]), 2)


def release_loan(conn, applicant):
    '''Sets the loan release date and initial loan deadline based on repayment period'''

    try:
        # Convert incoming string to Python Date Object for math
        loan_release_date_obj = datetime.strptime(applicant["release_date"], "%Y-%m-%d")
        
        # Convert back to STRING for SQLite storage (Crucial to prevent Rollback)
        loan_release_date_str = loan_release_date_obj.strftime("%Y-%m-%d")
    except ValueError:
        raise ValueError("Invalid date format. Expected YYYY-MM-DD.")

    with conn.connect() as connection:
        # 1. FETCH LOAN DETAILS
        # Simplified query to rely on loan_id
        applicant_info = connection.execute(
            text(
                """
                SELECT 
                    l.loan_id, 
                    l.principal, 
                    l.total_loan, 
                    l.payment_time_period, 
                    l.payment_schedule,
                    lp.interest_rate
                FROM loans l
                LEFT JOIN loan_plans lp ON lp.plan_level = l.loan_plan_lvl
                WHERE l.loan_id = :loan_id
                """
            ), {
                "loan_id": applicant["loan_id"]
            }
        ).mappings().fetchone()

        if not applicant_info:
            raise ValueError(f"Loan ID {applicant.get('loan_id')} not found.")

        # 2. CALCULATE PAYMENT
        due_amount = compute_payment_amount(
            float(applicant_info['principal']),
            int(applicant_info['payment_time_period']),
            float(applicant_info['interest_rate']),
            applicant_info['payment_schedule']
        )

        # 3. CALCULATE TOTAL PAYMENTS (Using Global SCHEDS)
        total_payments = int(applicant_info['payment_time_period']) * SCHEDS[applicant_info['payment_schedule']]

        # 4. DETERMINE NEXT DUE DATE
        schedule = applicant_info['payment_schedule']
        if schedule == "Monthly":
            days_offset = 30
        elif schedule == "Bi-Weekly":
            days_offset = 15
        else: # Weekly
            days_offset = 7
            
        next_due_date_obj = loan_release_date_obj + timedelta(days=days_offset)
        next_due_date_str = next_due_date_obj.strftime("%Y-%m-%d") # String for SQLite

        # 5. UPDATE LOANS TABLE
        connection.execute(
            text("UPDATE loans SET status = :status, payment_start_date = :date WHERE loan_id = :loan_id"), {
                "status": "Approved",
                "date": loan_release_date_str, # Passed as String
                "loan_id": applicant["loan_id"]
            }
        )

        # 6. INSERT INTO LOAN_DETAILS 
        # FIX: Mapped to 'balance' column instead of 'amount_payable'
        connection.execute(
            text(
                """
                INSERT INTO loan_details 
                (loan_id, due_amount, next_due, balance, payments_remaining, is_current) 
                VALUES (:loan_id, :due_amount, :next_due, :balance, :payments_remaining, :is_current)
                """
            ), {
                "loan_id": applicant_info['loan_id'],
                "due_amount": float(due_amount),
                "next_due": next_due_date_str, # Passed as String
                "balance": float(applicant_info['total_loan']), # Matches Schema 'balance'
                "payments_remaining": int(total_payments),
                "is_current": 1
            }
        )

        connection.commit()

def parse_db_date(date_val):
    """Safely parses date from DB, handling strings, None, and diff formats."""
    if date_val is None:
        return None
    if isinstance(date_val, datetime):
        return date_val
    
    # Try common formats
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(date_val), fmt)
        except ValueError:
            continue
    return None # Fail safe

def update_balance(conn, data):
    loan_id = data.get("loan_id")
    try:
        payment_amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        raise ValueError("Invalid payment amount")

    if not loan_id or payment_amount <= 0:
        raise ValueError("Invalid Loan ID or Payment Amount")

    with conn.connect() as connection:
        trans = connection.begin() 
        try:
            # 1. Fetch Loan Config
            loan_info = connection.execute(
                text("SELECT payment_amount, payment_schedule FROM loans WHERE loan_id = :lid"),
                {"lid": loan_id}
            ).mappings().fetchone()

            if not loan_info:
                raise Exception(f"Loan {loan_id} not found")

            # 2. Fetch Active Details
            current_detail = connection.execute(
                text("SELECT * FROM loan_details WHERE loan_id = :lid AND is_current = 1"),
                {"lid": loan_id}
            ).mappings().fetchone()

            if not current_detail:
                raise Exception("No active loan details found")

            # 3. GET CURRENT BALANCE & VALIDATE OVERPAYMENT
            current_balance = float(current_detail['balance'] or 0)
            
            # BLOCKER: Check if payment exceeds balance (with 0.01 float tolerance)
            if payment_amount > (current_balance + 0.01):
                raise ValueError(f"Overpayment rejected. You cannot pay {payment_amount:,.2f} when balance is {current_balance:,.2f}.")

            # 4. Deactivate Old Record
            connection.execute(
                text("UPDATE loan_details SET is_current = 0 WHERE loan_detail_id = :did"),
                {"did": current_detail['loan_detail_id']}
            )

            # 5. Prepare Calculations
            current_due = float(current_detail['due_amount'] or 0)
            instances = int(current_detail['payments_remaining'] or 0)
            due_date = parse_db_date(current_detail['next_due'])
            
            scheduled_amount = float(loan_info['payment_amount'] or 0)
            payment_schedule = loan_info['payment_schedule']
            today = datetime.now()
            remarks = "Payment"

            interval_map = {"Weekly": 7, "Bi-Weekly": 15, "Monthly": 30}
            interval_days = interval_map.get(payment_schedule, 30)

            # 6. Apply Payment Logic
            new_balance = current_balance - payment_amount
            new_due = current_due - payment_amount

            # Check if this payment covers the current due amount
            if new_due <= 0.01:
                instances = max(0, instances - 1)
                if due_date:
                    due_date += timedelta(days=interval_days)
                new_due = min(new_balance, scheduled_amount)
                remarks = "On-Time/Advance Payment"
            else:
                remarks = "Partial Payment"

            # 7. Check Settlement (Safe due to overpayment check above)
            if new_balance <= 0.01:
                new_balance = 0
                new_due = 0
                instances = 0
                remarks = "Settled"
                due_date = None
                
                connection.execute(
                    text("UPDATE loans SET status = 'Settled' WHERE loan_id = :lid"),
                    {"lid": loan_id}
                )

            # 8. Insert New State
            connection.execute(
                text("""
                    INSERT INTO loan_details 
                    (loan_id, balance, due_amount, next_due, payments_remaining, is_current)
                    VALUES (:lid, :bal, :due, :nd, :rem, 1)
                """),
                {
                    "lid": loan_id,
                    "bal": new_balance,
                    "due": new_due,
                    "nd": due_date,
                    "rem": instances
                }
            )

            # 9. Log Transaction
            connection.execute(
                text("""
                    INSERT INTO payments (loan_id, amount_paid, transaction_date, remarks)
                    VALUES (:lid, :amt, :date, :rem)
                """),
                {
                    "lid": loan_id,
                    "amt": payment_amount,
                    "date": today,
                    "rem": remarks
                }
            )

            trans.commit()
            print(f"Success: Loan {loan_id} updated. Balance: {new_balance}")

        except Exception as e:
            trans.rollback()
            print(f"MICROBANK ERROR: {str(e)}") 
            raise e
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


# Python-based Integration
class Applicant:
    def __init__(self, data):
        self.first_name = data["first_name"]
        self.last_name = data["last_name"]
        self.middle_name = data["middle_name"]
        self.email = data["email"]
        self.phone_num = data["phone_number"]
        
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


