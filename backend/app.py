from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
import microbank as mb

app = Flask(__name__)
CORS(app)  # Enable CORS so React can call the API

#will add postgres connection later on --> will dockerize this app
conn = create_engine('sqlite:///database.db', echo=True)

@app.route('/api/login', methods=['POST'])
def login():
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
        return jsonify({"success": True, "message": "Login successful!"})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401


@app.route('/api/appform', methods=['POST'])
def loan_apply():
    # res = mb.determine_loan_eligibility('user')
    data = request.get_json()

    salary = data.get("monthlyIncome")

    if salary > 1:
        return jsonify({"accepted": True, "message": "Loan approved!"})
    return "success"


if __name__ == "__main__":
    app.run(debug=True)

