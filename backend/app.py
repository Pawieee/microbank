from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template_string, request, session
from flask_session import Session
from flask_cors import CORS
from functools import wraps
from sqlalchemy import create_engine, text
import microbank as mb
import json
import os
import resend
from dotenv import load_dotenv
from werkzeug.security import check_password_hash

# --- CONFIGURATION ---
load_dotenv()

app = Flask(__name__)
is_production = os.getenv("FLASK_ENV") == "production"

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = is_production 
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev_secret_fallback") 

Session(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
resend.api_key = os.getenv("RESEND_API_KEY")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database.db')
conn = create_engine(f'sqlite:///{DB_PATH}', echo=True)


# --- HELPER: AUDIT LOGGING ---
def log_audit(username, action, target_id=None, details=None):
    """Inserts a record into the audit_logs table, including IP Address."""
    # Capture IP Address
    # If behind a proxy (like Nginx), use X-Forwarded-For, otherwise remote_addr
    if request.headers.getlist("X-Forwarded-For"):
        ip_address = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip_address = request.remote_addr

    try:
        with conn.connect() as connection:
            connection.execute(
                text("INSERT INTO audit_logs (username, action, target_id, details, ip_address) VALUES (:u, :a, :t, :d, :ip)"),
                {"u": username, "a": action, "t": target_id, "d": details, "ip": ip_address}
            )
            connection.commit()
    except Exception as e:
        print(f"FAILED TO LOG AUDIT: {e}")

# --- DECORATOR: LOGIN REQUIRED (Base check) ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("username") is None:
            return jsonify({"success": False, "message": "User not logged in"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- DECORATOR: ROLE REQUIRED (Strict RBAC) ---
def role_required(allowed_roles):
    """
    Ensures the logged-in user has one of the allowed roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 1. Check Login
            if session.get("username") is None:
                return jsonify({"success": False, "message": "User not logged in"}), 401
            
            # 2. Check Role
            user_role = session.get("role")
            if user_role not in allowed_roles:
                # Log the unauthorized attempt
                log_audit(session["username"], "UNAUTHORIZED_ACCESS", request.path, f"Required: {allowed_roles}, Got: {user_role}")
                return jsonify({"success": False, "message": "Permission denied"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/auth/check', methods=['GET'])
@login_required 
def check_session():
    """
    Returns 200 OK if logged in.
    Accessible by ALL roles (Admin, Manager, Teller).
    """
    return jsonify({
        "success": True,
        "username": session.get("username"),
        "role": session.get("role")
    }), 200

# ==========================================
# AUTHENTICATION ROUTES (Public)
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    if request.method == "POST":
        session.clear()

        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"success": False, "message": "Username and password required"}), 400

        with conn.connect() as connection:
            users = connection.execute(
                text("SELECT username, password, role FROM users WHERE username = :username"),
                {"username": username}
            ).mappings().fetchall()

        if len(users) != 1:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
        
        user_record = users[0]
        
        if check_password_hash(user_record["password"], password):
            # SUCCESS: Set Session
            session["username"] = user_record["username"]
            session["role"] = user_record["role"]
            
            # Log the Event
            log_audit(session["username"], "LOGIN", "N/A", "User logged in successfully")
            
            return jsonify({
                "success": True, 
                "username": session["username"],
                "role": session["role"]
            })
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    if session.get("username"):
        log_audit(session["username"], "LOGOUT", "N/A", "User logged out")
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})


# ==========================================
# ADMIN ROUTES (IT / Audit)
# ==========================================

# 1. AUDIT LOGS: STRICTLY ADMIN
@app.route("/api/logs", methods=["GET"])
@role_required(['admin'])
def get_logs():
    with conn.connect() as connection:
        logs = connection.execute(text("""
            SELECT log_id, username, action, target_id, details, ip_address, timestamp 
            FROM audit_logs 
            ORDER BY timestamp DESC LIMIT 100
        """)).mappings().fetchall()
        
        return jsonify([dict(row) for row in logs]), 200

# Placeholder for User Management (To be added later)
# @app.route("/api/users", methods=["POST", "DELETE"])
# @role_required(['admin'])
# def manage_users(): ...


# ==========================================
# MANAGER ROUTES (Branch Head)
# ==========================================

# 2. DASHBOARD: STRICTLY MANAGER
# Admin (IT) should not see financial profit/loss data.
@app.route("/api/dashboard-stats", methods=["GET"])
@role_required(['manager']) 
def dashboard_stats():
    with conn.connect() as connection:
        approved_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Approved'")).scalar()
        pending_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Pending'")).scalar()
        settled_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Settled'")).scalar()

        total_disbursed = connection.execute(text("SELECT SUM(principal) FROM loans WHERE status IN ('Approved', 'Settled')")).scalar() or 0
        total_payments = connection.execute(text("SELECT SUM(amount_paid) FROM payments")).scalar() or 0
        average_loan = connection.execute(text("SELECT AVG(total_loan) FROM loans")).scalar() or 0

        daily_applicant_count = connection.execute(text("""
                SELECT DATE(application_date) AS date, COUNT(*) AS applicant_count
                FROM loans GROUP BY DATE(application_date) ORDER BY DATE(application_date) DESC
            """)).fetchall()

        daily_applicant_data = [{"date": row[0], "applicant_count": row[1]} for row in daily_applicant_count]

        return jsonify({
            "approved_loans": approved_loans,
            "pending_loans": pending_loans,
            "settled_loans": settled_loans,
            "total_disbursed": total_disbursed,
            "total_payments": total_payments,
            "average_loan_amount": average_loan,
            "daily_applicant_data": daily_applicant_data,
        }), 200

# 3. DISBURSE: STRICTLY MANAGER
@app.route('/api/loans/disburse', methods=['POST'])
@role_required(['manager']) 
def approve_loan():
    try:
        data = request.json
        mb.release_loan(conn, data)
        
        log_audit(session["username"], "DISBURSE_LOAN", str(data.get('loan_id', '?')), "Loan funds released")
        
        return jsonify({"success": True, "message": "Loan has been approved."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# OPERATIONAL ROUTES (Teller & Manager)
# ==========================================
# Admin (IT) is excluded from these to protect customer privacy.

# 4. PAYMENTS
@app.route('/api/loans/payment', methods=['POST'])
@role_required(['teller', 'manager']) 
def payment():
    try:
        data = request.json
        mb.update_balance(conn, data)
        
        log_audit(session["username"], "COLLECT_PAYMENT", str(data.get('loan_id', '?')), f"Amount: {data.get('amount', 0)}")
        
        return jsonify({"success": True, "message": "Payment recorded."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# 5. VIEW APPLICATIONS (Pending)
@app.route("/api/applications", methods=["GET"])
@role_required(['teller', 'manager'])
def get_applications():
    with conn.connect() as connection:
        loans = connection.execute(text('''
        SELECT 
            l.loan_id AS loan_id,
            first_name || ' ' || last_name AS applicant_name,
            application_date AS start_date,
            payment_time_period AS duration,
            principal AS amount,
            status,
            email,
            application_date AS date_applied,
            COALESCE(due_amount, 0) AS due_amount,
            l.applicant_id as applicant_id
        FROM loans l
        LEFT JOIN applicants a ON l.applicant_id = a.applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = l.loan_id AND is_current = 1
        WHERE status = 'Pending';
        ''')).mappings().fetchall()
        loans = [dict(loan) for loan in loans] 
    return jsonify(loans), 200

# 6. VIEW ACTIVE LOANS
@app.route("/api/loans", methods=["GET"])
@role_required(['teller', 'manager'])
def get_loans():
    with conn.connect() as connection:
        loans = connection.execute(text('''
        SELECT 
            l.loan_id AS loan_id,
            CONCAT(a.first_name, ' ', a.last_name) AS applicant_name,
            l.application_date AS start_date,
            l.payment_time_period AS duration,
            l.total_loan AS amount,
            l.status,
            a.email,
            l.application_date AS date_applied,
            COALESCE(MAX(ld.due_amount), 0) AS due_amount,
            l.applicant_id AS applicant_id
        FROM loans l
        LEFT JOIN applicants a ON l.applicant_id = a.applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = l.loan_id AND ld.is_current = 1
        WHERE l.status IN ('Approved', 'Settled')
        GROUP BY l.loan_id, applicant_name, start_date, duration, amount, l.status, a.email, date_applied, l.applicant_id;
        ''')).mappings().fetchall()
        return jsonify([dict(loan) for loan in loans]), 200

# 7. VIEW SINGLE LOAN DETAILS
@app.route("/api/loans/<id>", methods=["GET"])
@role_required(['teller', 'manager'])
def get_loan(id):
    # Log who viewed this specific loan (Important for privacy)
    log_audit(session["username"], "VIEW_LOAN_DETAILS", id, "Viewed PII")
    
    with conn.connect() as connection:
        loan = connection.execute(text('''
        SELECT 
            l.loan_id AS loan_id,
            CONCAT(first_name, ' ', last_name) AS applicant_name,
            a.applicant_id,
            application_date AS start_date,
            payment_time_period AS duration,
            total_loan AS amount,
            l.principal AS principal,
            l.payment_schedule AS payment_schedule,
            a.phone_num AS phone_number,
            a.employment_status,
            a.credit_score,
            ld.next_due,
            status,
            email,
            application_date AS date_applied,
            COALESCE(due_amount, 0) as due_amount,
            lp.interest_rate
        FROM loans l
        LEFT JOIN applicants a ON l.applicant_id = a.applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = a.applicant_id AND is_current = 1
        LEFT JOIN loan_plans lp ON l.loan_plan_lvl = lp.plan_level
        WHERE l.loan_id = :loan_id;
        '''), { "loan_id": id}).mappings().fetchone()
    
    if loan:
        return jsonify(dict(loan)), 200
    else:
        return jsonify({"error": "Loan not found"}), 404

# 8. SUBMIT APPLICATION
@app.route('/api/appform', methods=['GET','POST'])
@role_required(['teller', 'manager'])
def loan_apply():
    if request.method == "GET":
        return jsonify({"success": True, "message": "User is logged in"})
    
    # POST
    data = request.get_json()
    try:
        applicant = mb.Applicant(data)
        if applicant.assess_eligibility(): # Fixed spelling from your snippet
            log_audit(session["username"], "CREATE_APPLICATION", "New", "Eligibility Passed")
            return jsonify({"accepted": True, "message": "Loan request approved!"})
        else:
            log_audit(session["username"], "CREATE_APPLICATION", "New", "Eligibility Failed")
            return jsonify({"accepted": False, "message": "Loan request denied!"})
    except Exception as e:
        print(f"Error in appform: {e}")
        return jsonify({"accepted": False, "message": "Error processing application"}), 500

# 9. GET PAYMENTS HISTORY
@app.route('/api/payments/<loan_id>', methods=['GET'])
@role_required(['teller', 'manager'])
def get_payments_by_loan_id(loan_id):
    with conn.connect() as connection:
        result = connection.execute(text("""
            SELECT payment_id, amount_paid, remarks, transaction_date
            FROM payments WHERE loan_id = :loan_id ORDER BY transaction_date DESC
        """), {"loan_id": loan_id}).mappings().fetchall()

        total_result = connection.execute(text("""
            SELECT SUM(amount_paid) AS total_paid FROM payments WHERE loan_id = :loan_id
        """), {"loan_id": loan_id}).scalar()

        return jsonify({
            "payments": [dict(row) for row in result],
            "total_paid": total_result or 0
        }), 200

# 10. PRE-CHECK NOTIFICATION (Can limit to staff)
@app.route('/api/loan-status-notification', methods=['POST'])
@role_required(['teller', 'manager'])
def loan_status_notification():
    try:
        data = request.json
        applicant = mb.Applicant(data)
        result = applicant.assess_eligibility()
        
        if result['status'] == "Approved":
            applicant.load_to_db(conn)
            loan_status = "Approved"  
        else:
            loan_status = "Denied"
        return jsonify({"status": loan_status}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error processing request"}), 500

# 11. SEND EMAIL (Manager Only - usually automated but triggered by Manager action)
@app.route("/api/send-loan-status-email", methods=["POST"])
@role_required(['manager'])
def send_loan_status_email():
    try:
        loan_data = request.json
        if not loan_data:
            raise ValueError("No data received.")

        recipient_email = loan_data.get("email")
        loan_status = loan_data.get("status")
        applicant_name = loan_data.get("applicant_name")
        loan_amount = loan_data.get("loan_amount")
        loan_purpose = loan_data.get("loan_purpose")
        support_email = loan_data.get("support_email")

        if not all([recipient_email, loan_status, applicant_name, loan_amount, loan_purpose]):
            raise ValueError("Missing required fields.")

        subject = f"Your Loan Application: {loan_status.capitalize()}"

        html_content = render_template_string(
            """
            <html>
              <body style="font-family: sans-serif; background-color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                  <h2 style="text-align: center;">Microbank</h2>
                  <h3 style="text-align: center;">Loan Application {{ 'Approved ✅' if status == 'Approved' else 'Rejected ❌' }}</h3>
                  <p>Hello <strong>{{ applicant_name }}</strong>,</p>
                  <p>We would like to inform you that your loan application has been <strong style="color: {{ 'green' if status == 'Approved' else 'red' }}">{{ status }}</strong>.</p>
                  <p><strong>Loan Amount:</strong> {{ loan_amount }}</p>
                  <p><strong>Loan Purpose:</strong> {{ loan_purpose }}</p>
                  <p><strong>Status:</strong> {{ 'Approved' if status == 'Approved' else 'Rejected' }}</p>
                  {% if status == 'Approved' %}
                    <p>Please wait for further communication regarding the disbursement process.</p>
                  {% else %}
                    <p>If you have any questions or wish to re-apply, feel free to contact our support team.</p>
                  {% endif %}
                  <hr />
                  <p style="font-size: 12px; color: #888;">This is an automated message from Microbank. If you believe this was sent in error or need assistance, please reach out to us at <a href="mailto:{{ support_email }}" style="color: #0066cc;">{{ support_email }}</a>.</p>
                </div>
              </body>
            </html>
            """,
            applicant_name=applicant_name,
            status=loan_status,
            loan_amount=loan_amount,
            loan_purpose=loan_purpose,
            support_email=support_email
        )

        params = {
            "from": "Microbank <onboarding@resend.dev>",
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }

        response = resend.Emails.send(params)

        return jsonify({"message": "Email sent successfully", "response": response}), 200

    except ValueError as ve:
        return jsonify({"message": f"Error: {str(ve)}"}), 400
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({"message": f"Error sending email: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=not is_production)