import random
from datetime import datetime, timedelta, date
from sqlalchemy import text

# Loan Configuration
SCHEDS = {
    "Weekly": 4,
    "Bi-Weekly": 2,
    "Monthly": 1
}

# --- HELPERS ---

def generate_random_score():
    return random.choices(
        [random.randint(500, 579), random.randint(580, 669), random.randint(670, 739), random.randint(740, 850)],
        weights=[10, 30, 40, 20], 
        k=1
    )[0]

def get_interest_rate(amount, credit_score):
    if amount >= 40001: base_rate = 18
    elif amount >= 30001: base_rate = 15
    elif amount >= 20001: base_rate = 12
    elif amount >= 10001: base_rate = 8
    else: base_rate = 5
    
    if credit_score >= 740: base_rate -= 2
    elif credit_score < 600: base_rate += 5
    
    return max(3, base_rate)

def compute_payment_amount(principal, payment_time_period, interest, payment_schedule):
    total_loan = round(principal * (1 + (interest / 100)), 2)
    if payment_time_period <= 0: payment_time_period = 1
    total_payments = payment_time_period * SCHEDS.get(payment_schedule, 1)
    return round(total_loan / total_payments, 2)

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
                    l.payment_schedule
                FROM loans l
                WHERE l.loan_id = :loan_id
                """
            ), {
                "loan_id": applicant["loan_id"]
            }
        ).mappings().fetchone()

        if not applicant_info:
            raise ValueError(f"Loan ID {applicant.get('loan_id')} not found.")

        sched_multiplier = SCHEDS.get(applicant_info['payment_schedule'], 1)
        total_payments = int(applicant_info['payment_time_period']) * sched_multiplier
        
        schedule = applicant_info['payment_schedule']
        days_offset = 30 
        if schedule == "Bi-Weekly": days_offset = 15
        elif schedule == "Weekly": days_offset = 7
            
        next_due_date_obj = loan_release_date_obj + timedelta(days=days_offset)
        next_due_date_str = next_due_date_obj.strftime("%Y-%m-%d")

        connection.execute(
            text("UPDATE loans SET status = 'Approved', payment_start_date = :date WHERE loan_id = :loan_id"), {
                "date": loan_release_date_str,
                "loan_id": applicant["loan_id"]
            }
        )

        total_loan_amount = round(float(applicant_info['total_loan']), 2)
        installment_amount = round(total_loan_amount / total_payments, 2)

        connection.execute(
            text(
                """
                INSERT INTO loan_details 
                (loan_id, due_amount, next_due, balance, payments_remaining, is_current) 
                VALUES (:loan_id, :due_amount, :next_due, :balance, :payments_remaining, 1)
                """
            ), {
                "loan_id": applicant_info['loan_id'],
                "due_amount": installment_amount,
                "next_due": next_due_date_str,
                "balance": total_loan_amount,
                "payments_remaining": int(total_payments)
            }
        )
        connection.commit()

def parse_db_date(date_val):
    if date_val is None: return None
    if isinstance(date_val, (datetime, date)): return date_val
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try: return datetime.strptime(str(date_val), fmt)
        except ValueError: continue
    return None

def update_balance(conn, data):
    loan_id = data.get("loan_id")
    try:
        payment_amount = round(float(data.get("amount", 0)), 2)
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

            current_balance = round(float(current_detail['balance'] or 0), 2)
            
            # STRICT MODE: Prevent overpayment beyond the exact cent
            if payment_amount > current_balance:
                raise ValueError(f"Overpayment rejected. Max payment: {current_balance:,.2f}")

            # Deactivate current record
            connection.execute(
                text("UPDATE loan_details SET is_current = 0 WHERE loan_detail_id = :did"),
                {"did": current_detail['loan_detail_id']}
            )

            current_due = round(float(current_detail['due_amount'] or 0), 2)
            instances = int(current_detail['payments_remaining'] or 0)
            due_date = parse_db_date(current_detail['next_due'])
            
            scheduled_amount = round(float(loan_info['payment_amount'] or 0), 2)
            payment_schedule = loan_info['payment_schedule']
            interval_map = {"Weekly": 7, "Bi-Weekly": 15, "Monthly": 30}
            interval_days = interval_map.get(payment_schedule, 30)

            # Calculate New Balance
            new_balance = round(current_balance - payment_amount, 2)
            new_due = round(current_due - payment_amount, 2)
            remarks = "Partial Payment"

            # Check for Full Settlement
            if new_balance == 0.00:
                new_due = 0.00
                instances = 0
                remarks = "Settled"
                due_date = None
                connection.execute(text("UPDATE loans SET status = 'Settled' WHERE loan_id = :lid"), {"lid": loan_id})
            
            else:
                # LOAN CONTINUES
                if new_due <= 0.00:
                    instances = max(0, instances - 1)
                    if due_date: 
                        due_date += timedelta(days=interval_days)
                    
                    # --- STRICT ADJUSTMENT LOGIC ---
                    # If this is the LAST payment instance, force the due amount 
                    # to cover the ENTIRE remaining balance.
                    if instances == 1:
                        new_due = new_balance 
                        remarks = "Final Payment Scheduled"
                    else:
                        # Otherwise, use standard schedule, but capped at balance
                        new_due = min(new_balance, scheduled_amount)
                        remarks = "On-Time Payment"
                    
                    new_due = round(new_due, 2)

            connection.execute(
                text("""
                    INSERT INTO loan_details 
                    (loan_id, balance, due_amount, next_due, payments_remaining, is_current)
                    VALUES (:lid, :bal, :due, :nd, :rem, 1)
                """), { 
                    "lid": loan_id, 
                    "bal": new_balance, 
                    "due": new_due, 
                    "nd": due_date, 
                    "rem": instances 
                }
            )

            connection.execute(
                text("INSERT INTO payments (loan_id, amount_paid, transaction_date, remarks) VALUES (:lid, :amt, :date, :rem)"),
                { "lid": loan_id, "amt": payment_amount, "date": datetime.now(), "rem": remarks }
            )

            trans.commit()
        except Exception as e:
            trans.rollback()
            raise e

# ... (Applicant Class remains the same)

class Applicant:
    def __init__(self, data):
        self.first_name = data.get("first_name")
        self.last_name = data.get("last_name")
        self.middle_name = data.get("middle_name", "")
        raw_dob = data.get("date_of_birth")
        self.date_of_birth = None
        if raw_dob:
            try:
                if isinstance(raw_dob, str):
                    self.date_of_birth = datetime.strptime(raw_dob[:10], "%Y-%m-%d").date()
                else:
                    self.date_of_birth = raw_dob
            except ValueError: pass
        self.gender = data.get("gender")
        self.civil_status = data.get("civil_status")
        self.email = data.get("email")
        self.phone_num = data.get("phone_number")
        self.address = data.get("address")
        self.id_type = data.get("id_type")
        self.id_image_data = data.get("id_image_data", "")
        self.employment_status = data.get("employment_status", "").lower()
        self.monthly_revenue = float(data.get("monthly_revenue", 0))
        if "credit_score" in data and data["credit_score"]:
            self.credit_score = int(data["credit_score"])
        else:
            self.credit_score = generate_random_score()
        self.loan_amount = float(data.get("loan_amount", 0))
        self.loan_purpose = data.get("loan_purpose")
        self.repayment_period = int(data.get("repayment_period", 1))
        self.payment_schedule = data.get("payment_schedule")
        self.disbursement_method = data.get("disbursement_method")
        self.account_number = data.get("account_number", "")
        self.application_date = datetime.today()

    def calculate_offer(self):
        """Calculates the financial offer."""
        interest_rate = get_interest_rate(self.loan_amount, self.credit_score)
        
        # Round total loan calculation
        total_loan = round(self.loan_amount * (1 + (interest_rate / 100)), 2)
        
        sched_multiplier = SCHEDS.get(self.payment_schedule, 1)
        total_payments_count = self.repayment_period * sched_multiplier
        
        # Round payment amount calculation
        payment_amount = round(total_loan / total_payments_count, 2) if total_payments_count > 0 else total_loan

        return {
            "credit_score": self.credit_score,
            "interest_rate": interest_rate,
            "principal": self.loan_amount,
            "total_repayment": total_loan,
            "payment_amount": payment_amount,
            "payment_count": total_payments_count,
            "schedule": self.payment_schedule
        }

    def assess_eligibility(self):
        if self.credit_score < 500:
            return {"status": "Rejected", "reason": "Credit Score below 500 threshold"}
        offer = self.calculate_offer()
        monthly_burden = offer['payment_amount']
        if self.payment_schedule == 'Weekly': monthly_burden *= 4
        elif self.payment_schedule == 'Bi-Weekly': monthly_burden *= 2
        if monthly_burden > (self.monthly_revenue * 0.6):
             return {"status": "Rejected", "reason": "Monthly repayment exceeds 60% of income"}
        return {"status": "Approved", "offer": offer}

    def load_to_db(self, conn):
        offer = self.calculate_offer()
        try:
            with conn.connect() as connection:
                query_app = text("""
                    INSERT INTO applicants (
                        first_name, last_name, middle_name, 
                        date_of_birth, gender, civil_status,
                        email, phone_num, address,
                        id_type, id_image_data, 
                        employment_status, monthly_income, credit_score
                    ) VALUES (
                        :fn, :ln, :mn, :dob, :gen, :civ,
                        :em, :ph, :addr, :idt, :idimg, 
                        :emp, :inc, :cs
                    )
                """)
                result = connection.execute(query_app, {
                    "fn": self.first_name, "ln": self.last_name, "mn": self.middle_name,
                    "dob": self.date_of_birth, "gen": self.gender, "civ": self.civil_status,
                    "em": self.email, "ph": self.phone_num, "addr": self.address,
                    "idt": self.id_type, "idimg": self.id_image_data,
                    "emp": self.employment_status, "inc": self.monthly_revenue, "cs": self.credit_score
                })
                applicant_id = result.lastrowid
                
                plan_lvl = 1
                if self.loan_amount >= 40001: plan_lvl = 5
                elif self.loan_amount >= 30001: plan_lvl = 4
                elif self.loan_amount >= 20001: plan_lvl = 3
                elif self.loan_amount >= 10001: plan_lvl = 2

                query_loan = text("""
                    INSERT INTO loans (
                        applicant_id, loan_plan_lvl, 
                        principal, total_loan, payment_amount, 
                        loan_purpose, disbursement_method, disbursement_account_number,
                        application_date, payment_start_date, 
                        payment_time_period, payment_schedule, status
                    ) VALUES (
                        :aid, :lvl, :princ, :tot, :pay_amt, 
                        :purp, :d_meth, :d_acc,
                        :app_date, :start_date, 
                        :dur, :sched, :stat
                    )
                """)
                connection.execute(query_loan, {
                    "aid": applicant_id, "lvl": plan_lvl, 
                    "princ": offer['principal'], "tot": offer['total_repayment'], "pay_amt": offer['payment_amount'],
                    "purp": self.loan_purpose, "d_meth": self.disbursement_method, "d_acc": self.account_number,
                    "app_date": self.application_date, "start_date": None,
                    "dur": self.repayment_period, "sched": self.payment_schedule, "stat": "Pending"
                })
                connection.commit()
                print("Application saved to DB successfully.")
        except Exception as e:
            print(f"Error saving to DB: {e}")
            raise e