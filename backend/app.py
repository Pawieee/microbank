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
from werkzeug.security import check_password_hash, generate_password_hash

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

# --- HELPER: PHILIPPINE TIME ---
def get_ph_time():
    """Returns the current datetime in UTC+8 (Philippines Standard Time)"""
    return datetime.utcnow() + timedelta(hours=8)

# --- HELPER: AUDIT LOGGING ---
def log_audit(username, action, target_id=None, details=None):
    """Inserts a record into the audit_logs table."""
    if request.headers.getlist("X-Forwarded-For"):
        ip_address = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip_address = request.remote_addr

    current_time = get_ph_time()

    try:
        with conn.connect() as connection:
            connection.execute(
                text("INSERT INTO audit_logs (username, action, target_id, details, ip_address, timestamp) VALUES (:u, :a, :t, :d, :ip, :ts)"),
                {
                    "u": username, "a": action, "t": str(target_id) if target_id else None, 
                    "d": details, "ip": ip_address, "ts": current_time
                }
            )
            connection.commit()
    except Exception as e:
        print(f"FAILED TO LOG AUDIT: {e}")

# --- DECORATOR: LOGIN REQUIRED ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("username") is None:
            return jsonify({"success": False, "message": "User not logged in"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- DECORATOR: ROLE REQUIRED ---
def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if session.get("username") is None:
                return jsonify({"success": False, "message": "User not logged in"}), 401
            
            user_role = session.get("role")
            if user_role not in allowed_roles:
                log_audit(session["username"], "UNAUTHORIZED_ACCESS", request.path, f"Required: {allowed_roles}, Got: {user_role}")
                return jsonify({"success": False, "message": "Permission denied"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/auth/check', methods=['GET'])
@login_required 
def check_session():
    return jsonify({
        "success": True,
        "username": session.get("username"),
        "role": session.get("role"),
        "full_name": session.get("full_name") 
    }), 200

# ==========================================
# AUTHENTICATION ROUTES
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
            user = connection.execute(
                text("SELECT user_id, username, password, role, full_name, status, failed_login_attempts FROM users WHERE username = :username"),
                {"username": username}
            ).mappings().fetchone()

        if not user:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
        
        if user["status"] == 'locked':
            log_audit(username, "LOGIN_BLOCKED", "N/A", "Attempted login on locked account")
            return jsonify({"success": False, "message": "Account is locked due to too many failed attempts. Contact Admin."}), 403
        
        if user["status"] == 'suspended':
            log_audit(username, "LOGIN_BLOCKED", "N/A", "Attempted login on suspended account")
            return jsonify({"success": False, "message": "Account is suspended. Contact Admin."}), 403

        if check_password_hash(user["password"], password):
            # SUCCESS
            with conn.connect() as connection:
                connection.execute(
                    text("UPDATE users SET failed_login_attempts = 0, last_login = :ts WHERE user_id = :uid"),
                    {"uid": user["user_id"], "ts": get_ph_time()}
                )
                connection.commit()

            session["username"] = user["username"]
            session["role"] = user["role"]
            session["full_name"] = user["full_name"]
            
            log_audit(session["username"], "LOGIN", "N/A", "User logged in successfully")
            
            return jsonify({
                "success": True, 
                "username": session["username"],
                "role": session["role"],
                "full_name": session["full_name"]
            })
        else:
            # FAILURE
            new_attempts = (user["failed_login_attempts"] or 0) + 1
            
            with conn.connect() as connection:
                if new_attempts >= 5:
                    connection.execute(
                        text("UPDATE users SET failed_login_attempts = :fa, status = 'locked' WHERE user_id = :uid"),
                        {"fa": new_attempts, "uid": user["user_id"]}
                    )
                    log_audit(username, "ACCOUNT_LOCKED", "N/A", "Account locked after 5 failed attempts")
                    msg = "Account has been locked."
                else:
                    connection.execute(
                        text("UPDATE users SET failed_login_attempts = :fa WHERE user_id = :uid"),
                        {"fa": new_attempts, "uid": user["user_id"]}
                    )
                    msg = f"Invalid credentials. {5 - new_attempts} attempts remaining."
                connection.commit()

            return jsonify({"success": False, "message": msg}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    if session.get("username"):
        log_audit(session["username"], "LOGOUT", "N/A", "User logged out")
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})

# ==========================================
# USER SELF-SERVICE ROUTES
# ==========================================

@app.route("/api/me", methods=["GET"])
@login_required
def get_current_user():
    with conn.connect() as connection:
        user = connection.execute(
            text("SELECT username, full_name, role, created_at FROM users WHERE username = :u"),
            {"u": session["username"]}
        ).mappings().fetchone()
    return jsonify(dict(user)), 200

@app.route("/api/me/update-profile", methods=["PUT"])
@login_required
def update_own_profile():
    data = request.json
    full_name = data.get("full_name")
    
    if not full_name:
        return jsonify({"message": "Full name is required"}), 400

    with conn.connect() as connection:
        connection.execute(
            text("UPDATE users SET full_name = :fn WHERE username = :u"),
            {"fn": full_name, "u": session["username"]}
        )
        connection.commit()
        session["full_name"] = full_name
        
    log_audit(session["username"], "UPDATE_SELF_PROFILE", "N/A", f"Changed name to {full_name}")
    return jsonify({"success": True, "full_name": full_name}), 200

@app.route("/api/me/change-password", methods=["PUT"])
@login_required
def change_password():
    data = request.json
    current_pw = data.get("current_password")
    new_pw = data.get("new_password")

    with conn.connect() as connection:
        user = connection.execute(
            text("SELECT password FROM users WHERE username = :u"),
            {"u": session["username"]}
        ).mappings().fetchone()

        if not check_password_hash(user["password"], current_pw):
            return jsonify({"message": "Current password incorrect"}), 401

        hashed_pw = generate_password_hash(new_pw, method='pbkdf2:sha256')
        connection.execute(
            text("UPDATE users SET password = :p WHERE username = :u"),
            {"p": hashed_pw, "u": session["username"]}
        )
        connection.commit()

    log_audit(session["username"], "CHANGE_SELF_PASSWORD", "N/A", "User changed their own password")
    return jsonify({"success": True, "message": "Password updated"}), 200

# ==========================================
# ADMIN ROUTES (User Management & Logs)
# ==========================================

@app.route("/api/logs", methods=["GET"])
@role_required(['admin'])
def get_logs():
    with conn.connect() as connection:
        logs = connection.execute(text("""
            SELECT log_id, username, action, target_id, details, ip_address, timestamp 
            FROM audit_logs 
            ORDER BY timestamp DESC LIMIT 200
        """)).mappings().fetchall()
        
        return jsonify([dict(row) for row in logs]), 200

@app.route("/api/users", methods=["GET"])
@role_required(['admin'])
def get_users():
    with conn.connect() as connection:
        users = connection.execute(text("""
            SELECT user_id, username, full_name, role, status, last_login, created_at 
            FROM users 
            ORDER BY created_at DESC
        """)).mappings().fetchall()
        return jsonify([dict(row) for row in users]), 200

@app.route("/api/users", methods=["POST"])
@role_required(['admin'])
def create_user():
    data = request.json
    required = ["username", "password", "role", "full_name"]
    
    if not all(k in data for k in required):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        with conn.connect() as connection:
            existing = connection.execute(text("SELECT 1 FROM users WHERE username = :u"), {"u": data["username"]}).fetchone()
            if existing:
                return jsonify({"message": "Username already taken"}), 409

            hashed_pw = generate_password_hash(data["password"], method='pbkdf2:sha256')

            connection.execute(
                text("""
                    INSERT INTO users (username, password, full_name, role, status, failed_login_attempts) 
                    VALUES (:u, :p, :fn, :r, 'active', 0)
                """),
                {"u": data["username"], "p": hashed_pw, "fn": data["full_name"], "r": data["role"]}
            )
            connection.commit()
            
        log_audit(session["username"], "USER_CREATED", data["username"], f"Role: {data['role']}")
        return jsonify({"message": "User created successfully"}), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/users/<int:user_id>", methods=["PUT"])
@role_required(['admin'])
def update_user(user_id):
    data = request.json
    try:
        with conn.connect() as connection:
            target_user = connection.execute(text("SELECT username FROM users WHERE user_id = :id"), {"id": user_id}).mappings().fetchone()
            
            if not target_user:
                return jsonify({"message": "User not found"}), 404
                
            if target_user["username"] == session["username"] and (data.get("status") != "active" or data.get("role") != "admin"):
                return jsonify({"message": "You cannot suspend or demote your own account."}), 403

            updates = []
            params = {"id": user_id}
            
            if "role" in data:
                updates.append("role = :role")
                params["role"] = data["role"]
            if "status" in data:
                updates.append("status = :status")
                params["status"] = data["status"]
                if data["status"] == "active":
                    updates.append("failed_login_attempts = 0")
            if "full_name" in data:
                updates.append("full_name = :full_name")
                params["full_name"] = data["full_name"]

            if not updates:
                return jsonify({"message": "No changes provided"}), 400

            query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = :id"
            connection.execute(text(query), params)
            connection.commit()

        log_audit(session["username"], "USER_UPDATED", target_user["username"], f"Updated: {', '.join(data.keys())}")
        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/users/<int:user_id>/reset-password", methods=["POST"])
@role_required(['admin'])
def reset_password(user_id):
    data = request.json
    new_password = data.get("password")
    
    if not new_password:
        return jsonify({"message": "New password required"}), 400

    try:
        with conn.connect() as connection:
            hashed_pw = generate_password_hash(new_password, method='pbkdf2:sha256')
            
            target_user = connection.execute(text("SELECT username FROM users WHERE user_id = :id"), {"id": user_id}).mappings().fetchone()
            if not target_user:
                return jsonify({"message": "User not found"}), 404

            connection.execute(
                text("UPDATE users SET password = :p, failed_login_attempts = 0, status = 'active' WHERE user_id = :id"),
                {"p": hashed_pw, "id": user_id}
            )
            connection.commit()

        log_audit(session["username"], "PASSWORD_RESET", target_user["username"], "Admin reset password")
        return jsonify({"message": "Password reset successfully"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@role_required(['admin'])
def delete_user(user_id):
    try:
        with conn.connect() as connection:
            target_user = connection.execute(text("SELECT username FROM users WHERE user_id = :id"), {"id": user_id}).mappings().fetchone()
            
            if not target_user:
                return jsonify({"message": "User not found"}), 404

            if target_user["username"] == session["username"]:
                return jsonify({"message": "You cannot delete your own account."}), 403

            connection.execute(text("DELETE FROM users WHERE user_id = :id"), {"id": user_id})
            connection.commit()

        log_audit(session["username"], "USER_DELETED", target_user["username"], "Permanent deletion")
        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ==========================================
# MANAGER ROUTES (Dashboard & Operations)
# ==========================================

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

@app.route('/api/loans/disburse', methods=['POST'])
@role_required(['manager']) 
def approve_loan():
    try:
        data = request.json
        loan_id = data.get('loan_id')
        
        with conn.connect() as connection:
            applicant = connection.execute(
                text("SELECT first_name, last_name FROM applicants a JOIN loans l ON a.applicant_id = l.applicant_id WHERE l.loan_id = :id"),
                {"id": loan_id}
            ).fetchone()
            
            applicant_name = f"{applicant[0]} {applicant[1]}" if applicant else "Unknown Applicant"

        mb.release_loan(conn, data)
        log_audit(session["username"], "DISBURSE_LOAN", str(loan_id), f"Funds released to {applicant_name}")
        return jsonify({"success": True, "message": "Loan has been approved."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# OPERATIONAL ROUTES (Teller & Manager)
# ==========================================

@app.route('/api/loans/payment', methods=['POST'])
@role_required(['teller', 'manager']) 
def payment():
    try:
        data = request.json
        loan_id = data.get('loan_id')
        amount = data.get('amount')
        
        with conn.connect() as connection:
            applicant = connection.execute(
                text("SELECT first_name, last_name FROM applicants a JOIN loans l ON a.applicant_id = l.applicant_id WHERE l.loan_id = :id"),
                {"id": loan_id}
            ).fetchone()
            
            applicant_name = f"{applicant[0]} {applicant[1]}" if applicant else "Unknown Applicant"

        mb.update_balance(conn, data)
        
        log_audit(
            session["username"], 
            "COLLECT_PAYMENT", 
            str(loan_id), 
            f"Collected {amount} from {applicant_name}"
        )
        
        return jsonify({"success": True, "message": "Payment recorded."}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc() 
        return jsonify({"success": False, "message": str(e)}), 500
    
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
            l.applicant_id as applicant_id,
            a.credit_score, 
            a.monthly_income,
            a.employment_status,
            l.loan_purpose,
            l.payment_schedule,
            l.disbursement_method,
            l.disbursement_account_number,
            a.gender,
            a.civil_status,
            a.id_image_data,
            a.id_type,
            a.phone_num,
            a.address
        FROM loans l
        LEFT JOIN applicants a ON l.applicant_id = a.applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = l.loan_id AND is_current = 1
        WHERE status = 'Pending';
        ''')).mappings().fetchall()
        
        # Convert row objects to dicts
        loans = [dict(loan) for loan in loans] 
        
    return jsonify(loans), 200

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

@app.route("/api/loans/<id>", methods=["GET"])
@role_required(['teller', 'manager'])
def get_loan(id):
    with conn.connect() as connection:
        # UPDATE: Fetch updated fields (Purpose, Disbursement, KYC)
        loan = connection.execute(text('''
        SELECT 
            l.loan_id AS loan_id,
            CONCAT(first_name, ' ', last_name) AS applicant_name,
            a.applicant_id,
            a.phone_num AS phone_number,
            a.employment_status,
            a.credit_score,
            a.date_of_birth,
            a.civil_status,
            a.address,
            a.id_type,
            
            l.loan_purpose,
            l.disbursement_method,
            l.disbursement_account_number,
            l.application_date AS start_date,
            l.payment_time_period AS duration,
            l.total_loan AS amount,
            l.principal AS principal,
            l.payment_schedule AS payment_schedule,
            l.status,
            
            ld.next_due,
            a.email,
            l.application_date AS date_applied,
            COALESCE(due_amount, 0) as due_amount,
            lp.interest_rate
        FROM loans l
        LEFT JOIN applicants a ON l.applicant_id = a.applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = a.applicant_id AND is_current = 1
        LEFT JOIN loan_plans lp ON l.loan_plan_lvl = lp.plan_level
        WHERE l.loan_id = :loan_id;
        '''), { "loan_id": id}).mappings().fetchone()
    
    if loan:
        log_audit(
            session["username"], 
            "VIEW_PII", 
            str(id), 
            f"Viewed profile of {loan['applicant_name']}"
        )
        return jsonify(dict(loan)), 200
    else:
        return jsonify({"error": "Loan not found"}), 404

@app.route('/api/appform', methods=['GET','POST'])
@role_required(['teller', 'manager'])
def loan_apply():
    if request.method == "GET":
        return jsonify({"success": True, "message": "User is logged in"})
    
    data = request.get_json()
    applicant_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
    
    try:
        applicant = mb.Applicant(data)
        if applicant.assess_eligibility(): 
            log_audit(session["username"], "CREATE_APPLICATION", "New", f"Eligibility Passed for {applicant_name}")
            return jsonify({"accepted": True, "message": "Loan request approved!"})
        else:
            log_audit(session["username"], "CREATE_APPLICATION", "New", f"Eligibility Failed for {applicant_name}")
            return jsonify({"accepted": False, "message": "Loan request denied!"})
    except Exception as e:
        print(f"Error in appform: {e}")
        return jsonify({"accepted": False, "message": "Error processing application"}), 500

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

@app.route('/api/loan-status-notification', methods=['POST'])
@role_required(['teller', 'manager'])
def loan_status_notification():
    try:
        data = request.json
        # Convert incoming date string (ISO) to python readable format if needed
        # The frontend sends standard ISO strings which Applicant class handles,
        # but explicit parsing helps avoid ambiguity.
        
        applicant = mb.Applicant(data)
        result = applicant.assess_eligibility()
        
        if result['status'] == "Approved":
            # Pass connection explicitly
            applicant.load_to_db(conn)
            loan_status = "Approved"
            
            # Log the successful application
            applicant_name = f"{data.get('first_name')} {data.get('last_name')}"
            log_audit(session["username"], "APPLICATION_SUBMITTED", "New", f"Submitted for {applicant_name}")
        else:
            loan_status = "Denied"
            
        return jsonify({"status": loan_status}), 200
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Error processing request"}), 500

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