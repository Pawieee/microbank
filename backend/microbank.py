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

# Map text rating to numeric for Database Storage
CREDIT_SCORE_MAP = {
    "excellent": 800,
    "good": 700,
    "fair": 630,
    "poor": 500,
    "no-score": 0
}

# --- HELPERS ---

def get_ratio(salary, loan_amount, repayment_period, schedule):
    rates = {}
    key_lvl = None
    # Default to Level 1 if out of bounds, or handle error
    key_lvl = 1
    rates = LOAN_LEVELS[1]

    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= loan_amount <= details["range"][1]:
            key_lvl = level
            rates = details
            break
            
    total_loan = loan_amount + (loan_amount * (rates['interest'] / 100))
    # Safety check for division by zero
    if repayment_period == 0: repayment_period = 1
    
    monthly_payment = total_loan / repayment_period
    
    # Calculate approximate monthly payment equivalent for ratio checking
    monthly_amortization = total_loan / repayment_period 
    
    # Calculate actual payment per schedule (e.g., per week)
    sched_payment = round(total_loan / (repayment_period * SCHEDS.get(schedule, 1)), 2)

    res = {
        "ratio": monthly_amortization / salary if salary else float('inf'), 
        "loan_lvl": key_lvl, 
        "total_loan": total_loan, 
        "monthly_payment": sched_payment
    }
    return res

# Scoring System
def calculate_score(applicant):
    scores = {
        "employment": {"unemployed": 3, "self-employed": 6, "employed": 10, "business-owner": 10, "ofw": 8, "retired": 5},
        "loan_to_salary_ratio": {"low": 10, "mid": 7, "high": 2},
        "repayment_period": {"short": 10, "medium": 6, "long": 3},
        "credit_score": {"poor": 3, "fair": 6, "good": 8, "excellent": 10, "no-score": 5}
    }
    
    # Safety fallback for keys not found
    emp_score = scores["employment"].get(applicant["employment"], 3)
    ratio_score = scores["loan_to_salary_ratio"].get(applicant["loan_to_salary_ratio"], 2)
    period_score = scores["repayment_period"].get(applicant["repayment_period"], 3)
    credit_score = scores["credit_score"].get(applicant["credit_score"], 3)

    total_score = (
        (emp_score * WEIGHTS["employment"]) +
        (ratio_score * WEIGHTS["loan_to_salary_ratio"]) +
        (period_score * WEIGHTS["repayment_period"]) +
        (credit_score * WEIGHTS["credit_score"])
    )
    
    return total_score

def determine_loan_eligibility(applicant):
    score = calculate_score(applicant)
    
    if score < 6: # Lowered threshold slightly for MVP flexibility
        return {"status": "Rejected", "reason": "Score too low", "score": score}
    
    # Check if amount is valid
    valid_range = False
    for level, details in LOAN_LEVELS.items():
        if details["range"][0] <= applicant["loan_requested"] <= details["range"][1]:
            valid_range = True
            break
    
    if not valid_range:
         return {"status": "Rejected", "reason": "Loan amount out of range", "score": score}

    return {
        "status": "Approved",
        "score": score
    }

def compute_payment_amount(principal, payment_time_period, interest, payment_schedule):
    total_loan = principal + (principal * (interest / 100))
    return round(total_loan / (payment_time_period * SCHEDS[payment_schedule]), 2)


# --- LOAN OPERATIONS ---

def release_loan(conn, applicant):
    '''Sets the loan release date and initial loan deadline'''
    try:
        loan_release_date_obj = datetime.strptime(applicant["release_date"], "%Y-%m-%d")
        loan_release_date_str = loan_release_date_obj.strftime("%Y-%m-%d")
    except ValueError:
        raise ValueError("Invalid date format. Expected YYYY-MM-DD.")

    with conn.connect() as connection:
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

        due_amount = compute_payment_amount(
            float(applicant_info['principal']),
            int(applicant_info['payment_time_period']),
            float(applicant_info['interest_rate']),
            applicant_info['payment_schedule']
        )

        total_payments = int(applicant_info['payment_time_period']) * SCHEDS[applicant_info['payment_schedule']]

        schedule = applicant_info['payment_schedule']
        if schedule == "Monthly": days_offset = 30
        elif schedule == "Bi-Weekly": days_offset = 15
        else: days_offset = 7
            
        next_due_date_obj = loan_release_date_obj + timedelta(days=days_offset)
        next_due_date_str = next_due_date_obj.strftime("%Y-%m-%d")

        connection.execute(
            text("UPDATE loans SET status = 'Approved', payment_start_date = :date WHERE loan_id = :loan_id"), {
                "date": loan_release_date_str,
                "loan_id": applicant["loan_id"]
            }
        )

        connection.execute(
            text(
                """
                INSERT INTO loan_details 
                (loan_id, due_amount, next_due, balance, payments_remaining, is_current) 
                VALUES (:loan_id, :due_amount, :next_due, :balance, :payments_remaining, 1)
                """
            ), {
                "loan_id": applicant_info['loan_id'],
                "due_amount": float(due_amount),
                "next_due": next_due_date_str,
                "balance": float(applicant_info['total_loan']),
                "payments_remaining": int(total_payments)
            }
        )
        connection.commit()

def parse_db_date(date_val):
    if date_val is None: return None
    if isinstance(date_val, datetime): return date_val
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try: return datetime.strptime(str(date_val), fmt)
        except ValueError: continue
    return None

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
            loan_info = connection.execute(
                text("SELECT payment_amount, payment_schedule FROM loans WHERE loan_id = :lid"),
                {"lid": loan_id}
            ).mappings().fetchone()

            if not loan_info: raise Exception(f"Loan {loan_id} not found")

            current_detail = connection.execute(
                text("SELECT * FROM loan_details WHERE loan_id = :lid AND is_current = 1"),
                {"lid": loan_id}
            ).mappings().fetchone()

            if not current_detail: raise Exception("No active loan details found")

            current_balance = float(current_detail['balance'] or 0)
            if payment_amount > (current_balance + 0.01):
                raise ValueError(f"Overpayment rejected. Max payment: {current_balance:,.2f}")

            connection.execute(
                text("UPDATE loan_details SET is_current = 0 WHERE loan_detail_id = :did"),
                {"did": current_detail['loan_detail_id']}
            )

            current_due = float(current_detail['due_amount'] or 0)
            instances = int(current_detail['payments_remaining'] or 0)
            due_date = parse_db_date(current_detail['next_due'])
            
            scheduled_amount = float(loan_info['payment_amount'] or 0)
            payment_schedule = loan_info['payment_schedule']
            interval_map = {"Weekly": 7, "Bi-Weekly": 15, "Monthly": 30}
            interval_days = interval_map.get(payment_schedule, 30)

            new_balance = current_balance - payment_amount
            new_due = current_due - payment_amount
            remarks = "Partial Payment"

            if new_due <= 0.01:
                instances = max(0, instances - 1)
                if due_date: due_date += timedelta(days=interval_days)
                new_due = min(new_balance, scheduled_amount)
                remarks = "On-Time Payment"

            if new_balance <= 0.01:
                new_balance = 0; new_due = 0; instances = 0; remarks = "Settled"; due_date = None
                connection.execute(text("UPDATE loans SET status = 'Settled' WHERE loan_id = :lid"), {"lid": loan_id})

            connection.execute(
                text("""
                    INSERT INTO loan_details 
                    (loan_id, balance, due_amount, next_due, payments_remaining, is_current)
                    VALUES (:lid, :bal, :due, :nd, :rem, 1)
                """), { "lid": loan_id, "bal": new_balance, "due": new_due, "nd": due_date, "rem": instances }
            )

            connection.execute(
                text("INSERT INTO payments (loan_id, amount_paid, transaction_date, remarks) VALUES (:lid, :amt, :date, :rem)"),
                { "lid": loan_id, "amt": payment_amount, "date": datetime.now(), "rem": remarks }
            )

            trans.commit()
        except Exception as e:
            trans.rollback()
            raise e

def fetch_transactions(conn, applicant_id):
    with conn.connect() as connection:
        try:
            transactions = connection.execute(
                text('''
                    SELECT p.loan_id, amount_paid, remarks, transaction_date
                    FROM payments p
                    LEFT JOIN loans l ON l.loan_id = p.loan_id
                    WHERE l.applicant_id = :applicant_id
                    '''), {"applicant_id": applicant_id}
            ).mappings().fetchall()
            return [dict(row) for row in transactions]
        except Exception as e:
            print(f"Error fetching transactions: {e}")
            return []


# --- APPLICANT CLASS (UPDATED) ---

class Applicant:
    def __init__(self, data):
        # 1. Identity & Demographics
        self.first_name = data.get("first_name")
        self.last_name = data.get("last_name")
        self.middle_name = data.get("middle_name", "")
        
        # FIX: Robust Date Parsing
        raw_dob = data.get("date_of_birth")
        self.date_of_birth = None
        if raw_dob:
            try:
                # Handle ISO format from JS (e.g., 2000-01-01T00:00:00.000Z)
                if isinstance(raw_dob, str):
                    # Slice to just YYYY-MM-DD to avoid timezone issues
                    self.date_of_birth = datetime.strptime(raw_dob[:10], "%Y-%m-%d").date()
                else:
                    self.date_of_birth = raw_dob
            except ValueError:
                self.date_of_birth = None

        self.gender = data.get("gender")
        self.civil_status = data.get("civil_status")
        
        # 2. Contact & Location
        self.email = data.get("email")
        self.phone_num = data.get("phone_number")
        self.address = data.get("address")
        
        # 3. KYC
        self.id_type = data.get("id_type")
        self.id_image_data = data.get("id_image_data", "") # Stores Base64 string

        # 4. Financials
        self.employment_status = data.get("employment_status", "").lower()
        self.monthly_revenue = float(data.get("monthly_revenue", 0))
        self.credit_rating_text = data.get("credit_score", "no-score")
        self.credit_score_num = CREDIT_SCORE_MAP.get(self.credit_rating_text, 0)
        
        # 5. Loan Config
        self.loan_amount = float(data.get("loan_amount", 0))
        self.loan_purpose = data.get("loan_purpose")
        self.repayment_period = int(data.get("repayment_period", 1))
        self.payment_schedule = data.get("payment_schedule")
        
        # 6. Disbursement
        self.disbursement_method = data.get("disbursement_method")
        self.account_number = data.get("account_number", "")
        
        self.salary_to_loan_ratio = get_ratio(
            self.monthly_revenue, 
            self.loan_amount, 
            self.repayment_period, 
            self.payment_schedule
        )
        self.application_date = datetime.today()

    def assess_eligibility(self):
        ratio_val = self.salary_to_loan_ratio['ratio']
        ratio_category = "low" if ratio_val <= 0.15 else "mid" if ratio_val <= 0.28 else "high"

        period_category = (
            "short" if self.repayment_period <= 3
            else "medium" if self.repayment_period <= 12
            else "long"
        )

        factors = {
            "employment": self.employment_status,
            "loan_to_salary_ratio": ratio_category,
            "repayment_period": period_category,
            "credit_score": self.credit_rating_text,
            "loan_requested": self.loan_amount
        }

        print(f"Scoring Factors: {factors}")
        return determine_loan_eligibility(factors)

    def load_to_db(self, conn):
        try:
            with conn.connect() as connection:
                # 1. Insert Applicant
                query_app = text("""
                    INSERT INTO applicants (
                        first_name, last_name, middle_name, 
                        date_of_birth, gender, civil_status,
                        email, phone_num, address,
                        id_type, id_image_data, 
                        employment_status, monthly_income, credit_score
                    ) VALUES (
                        :fn, :ln, :mn, 
                        :dob, :gen, :civ,
                        :em, :ph, :addr,
                        :idt, :idimg,
                        :emp, :inc, :cs
                    )
                """)
                
                result = connection.execute(query_app, {
                    "fn": self.first_name, "ln": self.last_name, "mn": self.middle_name,
                    "dob": self.date_of_birth, "gen": self.gender, "civ": self.civil_status,
                    "em": self.email, "ph": self.phone_num, "addr": self.address,
                    "idt": self.id_type, "idimg": self.id_image_data,
                    "emp": self.employment_status, "inc": self.monthly_revenue, "cs": self.credit_score_num
                })
                
                applicant_id = result.lastrowid

                # 2. Insert Loan
                query_loan = text("""
                    INSERT INTO loans (
                        applicant_id, loan_plan_lvl, 
                        principal, total_loan, payment_amount, 
                        loan_purpose, disbursement_method, disbursement_account_number,
                        application_date, payment_start_date, 
                        payment_time_period, payment_schedule, status
                    ) VALUES (
                        :aid, :lvl, 
                        :princ, :tot, :pay_amt, 
                        :purp, :d_meth, :d_acc,
                        :app_date, :start_date, 
                        :dur, :sched, :stat
                    )
                """)

                connection.execute(query_loan, {
                    "aid": applicant_id,
                    "lvl": self.salary_to_loan_ratio['loan_lvl'],
                    "princ": self.loan_amount,
                    "tot": self.salary_to_loan_ratio['total_loan'],
                    "pay_amt": self.salary_to_loan_ratio['monthly_payment'],
                    "purp": self.loan_purpose,
                    "d_meth": self.disbursement_method,
                    "d_acc": self.account_number,
                    "app_date": self.application_date,
                    "start_date": None,
                    "dur": self.repayment_period,
                    "sched": self.payment_schedule,
                    "stat": "Pending"
                })

                connection.commit()
                print("Application saved to DB successfully.")
        except Exception as e:
            print(f"Error saving to DB: {e}")
            raise e