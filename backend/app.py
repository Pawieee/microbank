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


app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SECRET_KEY"] = "supersecret"

Session(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

#will add postgres connection later on --> will dockerize this app
conn = create_engine('sqlite:///database.db', echo=True)

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(session.get("username"))
        if session.get("username") is None:
            return jsonify({"success": False, "message": "User not logged in"}), 401
        return f(*args, **kwargs)

    return decorated_function

"""
        FOR DEBUGGING PURPOSES ONLY

"""
@app.before_request
def trace_session():
    print("Incoming request to:", request.path)
    print("Session contents:", dict(session))

@app.route("/api/debug-set-session")
def debug_set_session():
    with conn.connect() as connection:
        plans = connection.execute(text("SELECT * FROM loan_plans")).mappings().fetchall()
        return jsonify({"message": "Session set!", "session": session["username"], "plan_1":plans[3]['interest_rate']})


@app.route('/api/login', methods=['POST'])
def login():
    if request.method == "POST":
        session.clear()

        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        with conn.connect() as connection:
            users = connection.execute(
                text("SELECT username FROM users WHERE username = :username"),
                {"username": username}
            ).mappings().fetchall()

        if len(users) != 1:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        if users[0]["username"] == "admin":
            session["username"] = users[0]["username"]
            print("Set session in login:", session)
            return jsonify({"success": True, "username": session["username"]})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/appform', methods=['GET','POST'])
@login_required
def loan_apply():
    # res = mb.determine_loan_eligibility('user')
    if request.method == "GET":
        return jsonify({"success": True, "message": "User is logged in"})
    else:
        data = request.get_json()
        applicant = mb.Applicant(request.get_json()) # creates an applicant class object
        if applicant.assess_eligibity():
            # applicant.load_to_db(conn)
            return jsonify({"accepted": True, "message": "Loan request approved!"})
        else:
            return jsonify({"accepted": False, "message": "Loan request denied!"})
        salary = data.get("monthlyIncome")
        if salary > 1:
            return jsonify({"accepted": True, "message": "Loan approved!"})
        return "success"
    
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})

def load_mock_data(filename):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, "mock_data", filename)
    
    try:
        with open(file_path, "r") as file:
            data = json.load(file)
        return data
    except FileNotFoundError:
        return []  # Return empty list if file not found
    
@app.route('/api/loans/disburse', methods=['POST'])
def approve_loan():

    mb.release_loan(conn, request.json)

    return jsonify({
        "success": True,
        "message": "Loan has been approved."
    }), 200

@app.route('/api/loans/payment', methods=['POST'])
def payment():

    mb.update_balance(conn, request.json)
    print(request.json)
    # print(f"Approving loan ID: {request.json["application_id"]}")  # Logging for debugging

    return jsonify({
        "success": True,
        "message": "Loan has been approved."
    }), 200

@app.route('/api/payments/<loan_id>', methods=['GET'])
def get_payments_by_loan_id(loan_id):
    with conn.connect() as connection:
        result = connection.execute(text("""
            SELECT 
                payment_id,
                amount_paid,
                remarks,
                transaction_date
            FROM payments
            WHERE loan_id = :loan_id
            ORDER BY transaction_date DESC
        """), {"loan_id": loan_id}).mappings().fetchall()

# GUSTO NAKO KUHAON ANG TOTAL NABAYAD SA APPLICANT FOR THE PROGRESS BAR SA FRONTEND
        total_result = connection.execute(text("""
            SELECT SUM(amount_paid) AS total_paid
            FROM payments
            WHERE loan_id = :loan_id
        """), {"loan_id": loan_id}).scalar()

        payments = [dict(row) for row in result]

        return jsonify({
            "payments": payments,
            "total_paid": total_result or 0
        }), 200


@app.route("/api/applications", methods=["GET"])
def get_applications():
    with conn.connect() as connection:
        loans = connection.execute(text(
        '''
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
        '''
        )).mappings().fetchall()
        loans = [dict(loan) for loan in loans] 
    return jsonify(loans), 200

@app.route("/api/loans", methods=["GET"])
def get_loans():
    with conn.connect() as connection:
        loans = connection.execute(text(
        '''
        SELECT 
            l.loan_id AS loan_id,
            CONCAT(a.first_name, ' ', a.last_name) AS applicant_name,
            l.application_date AS start_date,
            l.payment_time_period AS duration,
            l.total_loan AS amount,
            l.status,
            a.email,
            l.application_date AS date_applied,
            COALESCE(MAX(ld.due_amount), 0) AS due_amount,  -- Only select the most recent due_amount (if any)
            l.applicant_id AS applicant_id
        FROM loans l
        LEFT JOIN applicants a ON l.applicant_id = a.applicant_id
        LEFT JOIN loan_details ld ON ld.loan_id = l.loan_id AND ld.is_current = 1
        WHERE l.status IN ('Approved', 'Settled')
        GROUP BY 
            l.loan_id,
            applicant_name,
            start_date,
            duration,
            amount,
            l.status,
            a.email,
            date_applied,
            l.applicant_id;
        '''
        )).mappings().fetchall()

        loans = [dict(loan) for loan in loans]

    return jsonify(loans), 200

@app.route("/api/loans/<id>", methods=["GET"])
def get_loan(id):
    with conn.connect() as connection:
        loan = connection.execute(text(
        '''
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
        -- Join with loan_plans using loan_plan_lvl to fetch interest_rate
        LEFT JOIN loan_plans lp ON l.loan_plan_lvl = lp.plan_level
        WHERE l.loan_id = :loan_id;
        '''
        ),
        { "loan_id": id}).mappings().fetchone()
    
    if loan:
        return jsonify(dict(loan)), 200
    else:
        return jsonify({"error": "Loan not found"}), 404


@app.route("/api/logs", methods=["GET"])
def get_logs():
    logs = load_mock_data("logs.json")
    return jsonify(logs), 200

@app.route('/api/loan-status-notification', methods=['POST'])
def loan_status_notification():
    try:
        # Get the data from the request
        data = request.json
        print("Received loan status notification data:", data)
        
        applicant = mb.Applicant(data)

        result = applicant.assess_eligibility()
        print(result)
        if result['status'] == "Approved":
            applicant.load_to_db(conn)
        # Simulate loan status approval or rejection logic (you can replace this with real logic)
            loan_status = "Approved"  # or "rejected" depending on the logic you want
        else:
            loan_status = "Denied"
        # Respond with the status
        return jsonify({"status": loan_status}), 200
    except Exception as e:
        print("Error processing loan status notification:", str(e))
        return jsonify({"message": "Error processing request"}), 500
    
@app.route('/api/loan-status-notification-typescript', methods=['POST'])
def loan_status_notification_typescript():
    try:
        # Get the applicant data from the request (this comes from TypeScript)
        data = request.json
        print("Received loan status notification data:", data)

        # Only save to the database if the status is approved
        applicant = mb.Applicant(data)
        applicant.load_to_db(conn)

        return jsonify({"status": "Approved"}), 200

    except Exception as e:
        print("Error processing loan status notification:", str(e))
        return jsonify({"message": "Error processing request"}), 500
    except Exception as e:
        print("Error processing loan status notification:", str(e))
        return jsonify({"message": "Error processing request"}), 500



@app.route("/api/send-loan-status-email", methods=["POST"])
def send_loan_status_email():
    try:
        loan_data = request.json
        if not loan_data:
            raise ValueError("No data received in the request body.")

        recipient_email = loan_data.get("email")
        loan_status = loan_data.get("status")
        applicant_name = loan_data.get("applicant_name")
        loan_amount = loan_data.get("loan_amount")
        loan_purpose = loan_data.get("loan_purpose")
        support_email = loan_data.get("support_email")

        if not all([recipient_email, loan_status, applicant_name, loan_amount, loan_purpose]):
            raise ValueError("Missing required fields in the request data.")

        subject = f"Your Loan Application: {loan_status.capitalize()}"

        html_content = render_template_string(
            """
            <html>
              <body style="font-family: sans-serif; background-color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                  <h2 style="text-align: center;">Microbank</h2>
                  <h3 style="text-align: center;">Loan Application {{ 'Approved ✅' if status == 'approved' else 'Rejected ❌' }}</h3>
                  <p>Hello <strong>{{ applicant_name }}</strong>,</p>
                  <p>We would like to inform you that your loan application has been <strong style="color: {{ 'green' if status == 'approved' else 'red' }}">{{ status }}</strong>.</p>
                  <p><strong>Loan Amount:</strong> {{ loan_amount }}</p>
                  <p><strong>Loan Purpose:</strong> {{ loan_purpose }}</p>
                  <p><strong>Status:</strong> {{ 'Approved' if status == 'approved' else 'Rejected' }}</p>
                  {% if status == 'approved' %}
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

@app.route("/api/dashboard-stats", methods=["GET"])
def dashboard_stats():
    with conn.connect() as connection:
        approved_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Approved'")).scalar()
        pending_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Pending'")).scalar()
        settled_loans = connection.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Settled'")).scalar()

        total_disbursed = connection.execute(text("SELECT SUM(principal) FROM loans WHERE status IN ('Approved', 'Settled')")).scalar() or 0
        total_payments = connection.execute(text("SELECT SUM(amount_paid) FROM payments")).scalar() or 0

        average_loan = connection.execute(text("SELECT AVG(total_loan) FROM loans")).scalar() or 0

        # Get all daily applicant counts (no time filter)
        daily_applicant_count = connection.execute(
            text("""
                SELECT 
                    DATE(application_date) AS date, 
                    COUNT(*) AS applicant_count
                FROM loans
                GROUP BY DATE(application_date)
                ORDER BY DATE(application_date) DESC
            """)
        ).fetchall()

        daily_applicant_data = [
            {"date": row[0], "applicant_count": row[1]}
            for row in daily_applicant_count
        ]

        return jsonify({
            "approved_loans": approved_loans,
            "pending_loans": pending_loans,
            "settled_loans": settled_loans,
            "total_disbursed": total_disbursed,
            "total_payments": total_payments,
            "average_loan_amount": average_loan,
            "daily_applicant_data": daily_applicant_data,
        }), 200



if __name__ == "__main__":
    app.run(debug=True)

