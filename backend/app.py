from flask import Flask, jsonify, request, session
from flask_session import Session
from flask_cors import CORS
from functools import wraps
from sqlalchemy import create_engine, text
import microbank as mb

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

@app.route('/api/apply_loan', methods=['GET','POST'])
@login_required
def loan_apply():
    # res = mb.determine_loan_eligibility('user')
    if request.method == "GET":
        return jsonify({"success": True, "message": "User is logged in"})
    else:
        data = request.get_json()

        applicant = mb.Applicant(data) # creates an applicant class object
        print(applicant.loan_date)
        print(applicant.assess_eligibility())
        # if applicant.assess_eligibity():
        #     applicant.load_to_db(conn)
        return jsonify({"accepted": True, "message": "Loan request approved!"})
        # else:
            # return jsonify({"accepted": False, "message": "Loan request denied!"})
        # salary = data.get("monthlyIncome")
        # if salary > 1:
        #     return jsonify({"accepted": True, "message": "Loan approved!"})
        # return "success"


if __name__ == "__main__":
    app.run(debug=True)

