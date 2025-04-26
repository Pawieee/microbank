from flask import Flask, jsonify, request, session
from flask_session import Session
from flask_cors import CORS
from functools import wraps
from sqlalchemy import create_engine, text
import microbank as mb
import json
import os

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


if __name__ == "__main__":
    app.run(debug=True)

