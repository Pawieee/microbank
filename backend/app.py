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
    return jsonify({"message": "Session set!", "session": session["username"]})


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
            applicant.load_to_db(conn)
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
    
@app.route('/api/loans/<loan_id>/approve', methods=['POST'])
def approve_loan(loan_id):
    print(f"Approving loan ID: {loan_id}")  # Logging for debugging

    return jsonify({
        "success": True,
        "message": "Loan has been approved."
    }), 200

# Route to get mock loans
@app.route("/api/loans", methods=["GET"])
def get_loans():
    loans = load_mock_data("loans.json")
    return jsonify(loans), 200

@app.route("/api/loans/<id>", methods=["GET"])
def get_loan(id):
    loans = load_mock_data("loans.json")
    # Find the loan with the matching ID
    loan = next((loan for loan in loans if loan["id"] == id), None)
    
    if loan:
        return jsonify(loan), 200
    else:
        return jsonify({"error": "Loan not found"}), 404

# Route to get mock logs
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
        
        # Simulate loan status approval or rejection logic (you can replace this with real logic)
        loan_status = "approved"  # or "rejected" depending on the logic you want

        # Respond with the status
        return jsonify({"status": loan_status}), 200
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
        applicant_name = loan_data.get("applicantName")
        loan_amount = loan_data.get("loanAmount")
        loan_purpose = loan_data.get("loanPurpose")
        support_email = loan_data.get("supportEmail")

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



if __name__ == "__main__":
    app.run(debug=True)

