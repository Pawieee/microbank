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
            
            # UPGRADE: Check the DB for the absolute latest role
            with conn.connect() as connection:
                user = connection.execute(
                    text("SELECT role, status FROM users WHERE username = :u"),
                    {"u": session["username"]}
                ).mappings().fetchone()

            # Security Check 1: Does user still exist?
            if not user:
                session.clear()
                return jsonify({"success": False, "message": "User no longer exists"}), 401

            # Security Check 2: Is account active? (Instant ban enforcement)
            if user['status'] != 'active':
                session.clear()
                return jsonify({"success": False, "message": "Account suspended"}), 403

            # Security Check 3: Check Role
            if user['role'] not in allowed_roles:
                log_audit(session["username"], "UNAUTHORIZED_ACCESS", request.path, f"Required: {allowed_roles}, Got: {user['role']}")
                return jsonify({"success": False, "message": "Permission denied"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/auth/check', methods=['GET'])
def check_session():
    if session.get("username"):
        return jsonify({
            "success": True,
            "username": session.get("username"),
            "role": session.get("role"),
            "full_name": session.get("full_name"),
            "is_first_login": session.get("is_first_login", False) 
        }), 200
    else:
        # ✅ RETURN 200 OK with success: False (Silences the red 401 error)
        return jsonify({
            "success": False,
            "message": "Guest"
        }), 200

# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "message": "Internal Server Error"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        # Flask ensures request.method is POST due to @app.route methods
        session.clear()
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"success": False, "message": "Username and password required"}), 200

        # 1. Fetch User
        with conn.connect() as connection:
            user = connection.execute(
                text("SELECT user_id, username, password, role, full_name, status, failed_login_attempts, is_first_login, lockout_until FROM users WHERE username = :username"),
                {"username": username}
            ).mappings().fetchone()

        # Handle User Not Found
        if not user:
            return jsonify({"success": False, "message": "Invalid credentials"}), 200
        
        # 2. CHECK LOCKOUT
        # If a lockout time exists, check if it's still valid
        if user["lockout_until"]:
            lockout_time = user["lockout_until"]
            
            # Robust Date Parsing
            if isinstance(lockout_time, str):
                try:
                    lockout_time = datetime.strptime(lockout_time, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    try:
                        lockout_time = datetime.strptime(lockout_time, '%Y-%m-%d %H:%M:%S.%f')
                    except:
                        lockout_time = get_ph_time() # Fallback

            # Check if current time is BEFORE the lockout time
            if lockout_time > get_ph_time():
                # ✅ RETURN IMMEDIATELY - Do not check password
                return jsonify({
                    "success": False, 
                    "message": "Account locked.",
                    "lockoutUntil": lockout_time.isoformat(),
                }), 200
            else:
                # ✅ Lockout Expired: Reset DB immediately
                with conn.connect() as connection:
                    connection.execute(
                        text("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE user_id = :uid"),
                        {"uid": user["user_id"]}
                    )
                    connection.commit()

        # 3. CHECK STATUS (Manual Locks/Suspensions)
        if user["status"] == 'locked' and not user["lockout_until"]:
             return jsonify({"success": False, "message": "Account is locked. Contact Admin."}), 200
        
        if user["status"] == 'suspended':
            return jsonify({"success": False, "message": "Account is suspended. Contact Admin."}), 200

        # 4. VERIFY PASSWORD
        if check_password_hash(user["password"], password):
            # SUCCESS
            with conn.connect() as connection:
                connection.execute(
                    text("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = :ts, status = 'active' WHERE user_id = :uid"),
                    {"uid": user["user_id"], "ts": get_ph_time()}
                )
                connection.commit()

            session["username"] = user["username"]
            session["role"] = user["role"]
            session["full_name"] = user["full_name"]
            session["is_first_login"] = bool(user["is_first_login"]) 
            
            return jsonify({
                "success": True, 
                "username": session["username"],
                "role": session["role"],
                "full_name": session["full_name"],
                "is_first_login": bool(user["is_first_login"]) 
            }), 200
        
        else:
            # FAILURE (Wrong Password)
            current_attempts = user["failed_login_attempts"] or 0
            new_attempts = current_attempts + 1
            max_attempts = 5
            
            msg = ""
            
            with conn.connect() as connection:
                if new_attempts >= max_attempts:
                    # ✅ LOCK THE ACCOUNT
                    # Ensure timedelta is imported from datetime
                    lockout_end = (get_ph_time() + timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S')
                    
                    connection.execute(
                        text("UPDATE users SET failed_login_attempts = :fa, lockout_until = :lu WHERE user_id = :uid"),
                        {"fa": new_attempts, "lu": lockout_end, "uid": user["user_id"]}
                    )
                    # Trigger the specific lockout message logic on frontend
                    # Note: We don't send 'lockoutUntil' here yet, the user must try again to see the timer, 
                    # OR you can send it immediately if you prefer.
                    msg = "Too many failed attempts. Account locked for 1 minute."
                else:
                    # Just increment attempts
                    connection.execute(
                        text("UPDATE users SET failed_login_attempts = :fa WHERE user_id = :uid"),
                        {"fa": new_attempts, "uid": user["user_id"]}
                    )
                    msg = f"Invalid credentials. {max_attempts - new_attempts} attempts remaining."
                
                connection.commit()

            return jsonify({"success": False, "message": msg}), 200

    except Exception as e:
        print(f"LOGIN ERROR: {e}") # Check your server terminal for the exact error string
        return jsonify({"success": False, "message": "System Error. Please try again."}), 200

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
    
    if not full_name: return jsonify({"message": "Full name is required"}), 400

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
    
    if not new_pw:
        return jsonify({"message": "New password is required"}), 400

    # LOGIC UPDATE: 
    # If is_first_login is True, we skip the current_password check 
    # because they just logged in with the temp password.
    # Otherwise, we enforce it.
    is_force_change = session.get("is_first_login", False)

    with conn.connect() as connection:
        user = connection.execute(
            text("SELECT password FROM users WHERE username = :u"),
            {"u": session["username"]}
        ).mappings().fetchone()

        if not is_force_change:
            if not current_pw:
                return jsonify({"message": "Current password required"}), 400
            if not check_password_hash(user["password"], current_pw):
                return jsonify({"message": "Current password incorrect"}), 401

        hashed_pw = generate_password_hash(new_pw, method='pbkdf2:sha256')
        
        # UPDATE: Set is_first_login to 0 (False)
        connection.execute(
            text("UPDATE users SET password = :p, is_first_login = 0 WHERE username = :u"),
            {"p": hashed_pw, "u": session["username"]}
        )
        connection.commit()
    
    # Update session immediately so modal doesn't pop up again
    session["is_first_login"] = False 

    log_audit(session["username"], "CHANGE_SELF_PASSWORD", "N/A", "User changed their own password")
    return jsonify({"success": True, "message": "Password updated successfully"}), 200

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
    if not all(k in data for k in ["username", "password", "role", "full_name"]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        with conn.connect() as connection:
            existing = connection.execute(text("SELECT 1 FROM users WHERE username = :u"), {"u": data["username"]}).fetchone()
            if existing: return jsonify({"message": "Username already taken"}), 409

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
            if not target_user: return jsonify({"message": "User not found"}), 404
                
            if target_user["username"] == session["username"] and (data.get("status") != "active" or data.get("role") != "admin"):
                return jsonify({"message": "You cannot suspend or demote your own account."}), 403

            updates = []
            params = {"id": user_id}
            
            if "role" in data:
                updates.append("role = :role"); params["role"] = data["role"]
            if "status" in data:
                updates.append("status = :status"); params["status"] = data["status"]
                if data["status"] == "active": updates.append("failed_login_attempts = 0")
            if "full_name" in data:
                updates.append("full_name = :full_name"); params["full_name"] = data["full_name"]

            if not updates: return jsonify({"message": "No changes provided"}), 400

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
    if not data.get("password"): return jsonify({"message": "New password required"}), 400

    try:
        with conn.connect() as connection:
            hashed_pw = generate_password_hash(data.get("password"), method='pbkdf2:sha256')
            target_user = connection.execute(text("SELECT username FROM users WHERE user_id = :id"), {"id": user_id}).mappings().fetchone()
            if not target_user: return jsonify({"message": "User not found"}), 404

            # UPDATE: Reset implies they must change it again (is_first_login = 1)
            connection.execute(
                text("UPDATE users SET password = :p, failed_login_attempts = 0, status = 'active', is_first_login = 1 WHERE user_id = :id"),
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
            if not target_user: return jsonify({"message": "User not found"}), 404
            if target_user["username"] == session["username"]: return jsonify({"message": "You cannot delete your own account."}), 403

            connection.execute(text("DELETE FROM users WHERE user_id = :id"), {"id": user_id})
            connection.commit()

        log_audit(session["username"], "USER_DELETED", target_user["username"], "Permanent deletion")
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ==========================================
# LOAN FLOW ROUTES
# ==========================================

@app.route('/api/check-eligibility', methods=['POST'])
@role_required(['teller', 'manager'])
def check_eligibility():
    try:
        data = request.json
        # Create Applicant -> Generates random score
        applicant = mb.Applicant(data)
        
        # Assess based on that score
        result = applicant.assess_eligibility()
        
        # Return both the decision and the score so frontend can display it
        response_data = {
            "status": result['status'],
            "reason": result.get('reason'),
            "credit_score": applicant.credit_score,
            "offer": result.get('offer')
        }
        
        return jsonify(response_data), 200
    except Exception as e:
        print(f"Error in eligibility check: {e}")
        return jsonify({"message": "Error processing request"}), 500

@app.route('/api/loan-status-notification', methods=['POST'])
@role_required(['teller', 'manager'])
def loan_status_notification():
    try:
        data = request.json
        # The data now comes with the 'credit_score' generated from the check-eligibility step
        applicant = mb.Applicant(data)
        
        # Double check eligibility
        result = applicant.assess_eligibility()
        
        if result['status'] == "Approved":
            applicant.load_to_db(conn)
            loan_status = "Approved"
            
            applicant_name = f"{data.get('first_name')} {data.get('last_name')}"
            log_audit(session["username"], "APPLICATION_SUBMITTED", "New", f"Submitted for {applicant_name}")
        else:
            loan_status = "Denied"
            
        return jsonify({"status": loan_status}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error processing request"}), 500
    
@app.route('/api/loans/approve-stage', methods=['POST'])
@role_required(['manager']) 
def approve_loan_stage():
    """
    Moves loan from 'Pending' to 'For Release'.
    This signifies the Manager has reviewed and accepted the risk,
    but money has not been released yet.
    """
    try:
        data = request.json
        loan_id = data.get('loan_id')
        
        with conn.connect() as connection:
            # 1. Check if loan exists and is Pending
            existing = connection.execute(
                text("SELECT 1 FROM loans WHERE loan_id = :id AND status = 'Pending'"),
                {"id": loan_id}
            ).fetchone()

            if not existing:
                return jsonify({"success": False, "message": "Loan not found or not in Pending state"}), 404

            # 2. Update Status to 'For Release'
            connection.execute(
                text("UPDATE loans SET status = 'For Release' WHERE loan_id = :id"),
                {"id": loan_id}
            )
            
            # 3. Get Details for Audit
            applicant = connection.execute(
                text("SELECT first_name, last_name FROM applicants a JOIN loans l ON a.applicant_id = l.applicant_id WHERE l.loan_id = :id"),
                {"id": loan_id}
            ).fetchone()
            applicant_name = f"{applicant[0]} {applicant[1]}" if applicant else "Unknown"

            connection.commit()

        log_audit(session["username"], "APPROVE_APPLICATION", str(loan_id), f"Application approved for {applicant_name}. Status: For Release")
        return jsonify({"success": True, "message": "Application approved. Waiting for closing."}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

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

@app.route('/api/loans/reject', methods=['POST'])
@role_required(['manager'])
def reject_loan():
    try:
        data = request.json
        loan_id = data.get('loan_id')
        remarks = data.get('remarks') # "Credit score too low"

        if not loan_id:
            return jsonify({"success": False, "message": "Loan ID is required"}), 400

        with conn.connect() as connection:
            # 1. Check if loan exists
            existing = connection.execute(
                text("SELECT 1 FROM loans WHERE loan_id = :id AND status = 'Pending'"),
                {"id": loan_id}
            ).fetchone()

            if not existing:
                return jsonify({"success": False, "message": "Loan not found or already processed"}), 404

            # 2. Update Status AND Remarks
            connection.execute(
                text("UPDATE loans SET status = 'Rejected', remarks = :r WHERE loan_id = :id"),
                {"id": loan_id, "r": remarks} # <--- Save remarks here
            )
            
            # 3. Get Applicant Name for Audit Log (Optional but good practice)
            applicant = connection.execute(
                text("SELECT first_name, last_name FROM applicants a JOIN loans l ON a.applicant_id = l.applicant_id WHERE l.loan_id = :id"),
                {"id": loan_id}
            ).fetchone()
            applicant_name = f"{applicant[0]} {applicant[1]}" if applicant else "Unknown Applicant"

            connection.commit()

        # 4. Audit Log (Still keep this for security trail)
        log_audit(session["username"], "REJECT_LOAN", str(loan_id), f"Rejected: {applicant_name}")
        
        return jsonify({"success": True, "message": "Application rejected successfully"}), 200

    except Exception as e:
        print(f"Error rejecting loan: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/loans/log-print', methods=['POST'])
@role_required(['teller', 'manager'])
def log_print_action():
    try:
        data = request.json
        loan_id = data.get('loan_id')
        action = data.get('action', 'PRINT_DOCUMENT')

        if not loan_id:
            return jsonify({"success": False, "message": "Loan ID required"}), 400

        # Get applicant details for better audit trail
        with conn.connect() as connection:
            applicant = connection.execute(
                text("SELECT first_name, last_name FROM applicants a JOIN loans l ON a.applicant_id = l.applicant_id WHERE l.loan_id = :id"),
                {"id": loan_id}
            ).fetchone()
            applicant_name = f"{applicant[0]} {applicant[1]}" if applicant else "Unknown"

        log_audit(session["username"], action, str(loan_id), f"Printed agreement for {applicant_name}")
        return jsonify({"success": True}), 200
    except Exception as e:
        # We don't want to break the UI flow if logging fails, but we should log the error
        print(f"Print Audit Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    
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
        log_audit(session["username"], "COLLECT_PAYMENT", str(loan_id), f"Collected {amount} from {applicant_name}")
        return jsonify({"success": True, "message": "Payment recorded."}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==========================================
# DATA FETCHING ROUTES
# ==========================================

@app.route("/api/dashboard-stats", methods=["GET"])
@role_required(['manager']) 
def dashboard_stats():
    with conn.connect() as connection:
        # 1. Basic Counts
        approved_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Approved'")).scalar() or 0
        pending_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Pending'")).scalar() or 0
        settled_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Settled'")).scalar() or 0
        rejected_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Rejected'")).scalar() or 0 # NEW

        # 2. Financials
        # Total Principal Released
        total_disbursed = connection.execute(text("SELECT SUM(principal) FROM loans WHERE status IN ('Approved', 'Settled')")).scalar() or 0
        
        # Total Actual Payments Collected
        total_payments = connection.execute(text("SELECT SUM(amount_paid) FROM payments")).scalar() or 0
        
        # Total Loan Value (Principal + Interest) of Active/Settled loans
        total_receivable = connection.execute(text("SELECT SUM(total_loan) FROM loans WHERE status IN ('Approved', 'Settled')")).scalar() or 0
        
        # Projected Revenue (Interest Income)
        net_revenue = total_receivable - total_disbursed

        # 3. Analytics: Daily Trend
        daily_applicant_count = connection.execute(text("""
                SELECT DATE(application_date) AS date, COUNT(*) AS applicant_count
                FROM loans GROUP BY DATE(application_date) ORDER BY DATE(application_date) ASC LIMIT 30
            """)).fetchall()
        daily_applicant_data = [{"date": row[0], "applicant_count": row[1]} for row in daily_applicant_count]

        # 4. Analytics: Loan Purpose Distribution (NEW)
        purpose_counts = connection.execute(text("""
            SELECT loan_purpose, COUNT(*) as count 
            FROM loans GROUP BY loan_purpose
        """)).fetchall()
        loan_purpose_data = [{"name": row[0] or "Unspecified", "value": row[1]} for row in purpose_counts]

        # 5. Analytics: Gender Distribution (NEW)
        gender_counts = connection.execute(text("""
            SELECT gender, COUNT(*) as count 
            FROM applicants GROUP BY gender
        """)).fetchall()
        demographic_data = [{"name": row[0] or "Unspecified", "value": row[1]} for row in gender_counts]

        return jsonify({
            "approved_loans": approved_loans,
            "pending_loans": pending_loans,
            "settled_loans": settled_loans,
            "rejected_loans": rejected_loans,
            "total_disbursed": total_disbursed,
            "total_payments": total_payments,
            "net_revenue": net_revenue,
            "daily_applicant_data": daily_applicant_data,
            "loan_purpose_data": loan_purpose_data,
            "demographic_data": demographic_data
        }), 200
    
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
            l.remarks, -- ADDED: Reason for rejection
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
        WHERE status IN ('Pending', 'Rejected', 'For Release')
        ORDER BY 
            CASE 
                WHEN status = 'Pending' THEN 1 
                WHEN status = 'For Release' THEN 2 
                ELSE 3 
            END,
            application_date DESC;
        ''')).mappings().fetchall()
        
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
            l.applicant_id AS applicant_id,
            
            -- Active Loan Specifics
            COALESCE(MAX(ld.due_amount), 0) AS due_amount,
            MAX(ld.balance) as balance,
            MAX(ld.next_due) as next_due,

            -- NEW FIELDS (KYC & Financials)
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
        LEFT JOIN loan_details ld ON ld.loan_id = l.loan_id AND ld.is_current = 1
        WHERE l.status IN ('Approved', 'Settled')
        GROUP BY l.loan_id;
        ''')).mappings().fetchall()
        return jsonify([dict(loan) for loan in loans]), 200

@app.route("/api/loans/<id>", methods=["GET"])
@role_required(['teller', 'manager'])
def get_loan(id):
    with conn.connect() as connection:
        loan = connection.execute(text('''
        SELECT 
            l.loan_id AS loan_id,
            -- Changed CONCAT to || for SQLite compatibility (if using SQLite)
            first_name || ' ' || last_name AS applicant_name,
            a.applicant_id,
            a.phone_num AS phone_number,
            a.employment_status,
            a.credit_score,
            a.date_of_birth,
            a.civil_status,
            a.address,
            a.id_type,
            
            a.gender,
            a.monthly_income,
            a.id_image_data, 
            
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
        -- Fixed Join: loan_details links to loan_id, not applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = l.loan_id AND is_current = 1
        LEFT JOIN loan_plans lp ON l.loan_plan_lvl = lp.plan_level
        WHERE l.loan_id = :loan_id;
        '''), { "loan_id": id}).mappings().fetchone()
    
    if loan:
        log_audit(session["username"], "VIEW_PII", str(id), f"Viewed profile of {loan['applicant_name']}")
        return jsonify(dict(loan)), 200
    else:
        return jsonify({"error": "Loan not found"}), 404

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

if __name__ == "__main__":
    app.run(debug=not is_production)