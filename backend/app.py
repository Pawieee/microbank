from flask import Flask, jsonify, request, session
from flask_session import Session
from functools import wraps
from flask_cors import CORS
from sqlalchemy import create_engine, text
import microbank as mb

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = "supersecret"

Session(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

#will add postgres connection later on --> will dockerize this app
conn = create_engine('sqlite:///database.db', echo=True)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("username") is None:
            return jsonify({"success": False, "message": "User not logged in"}), 401
        return f(*args, **kwargs)

    return decorated_function


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
            return jsonify({"success": True, "message": "Login successful!"})
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
        salary = data.get("monthlyIncome")
        if salary > 1:
            return jsonify({"accepted": True, "message": "Loan approved!"})
        return "success"


if __name__ == "__main__":
    app.run(debug=True)

