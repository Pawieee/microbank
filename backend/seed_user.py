from flask import Flask
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database.db')
conn = create_engine(f'sqlite:///{DB_PATH}', echo=True)

def seed_users():
    staff_accounts = [
        {
            "username": "admin", 
            "password": "MicroBank123!", 
            "role": "admin"     # Can manage users & view audit logs
        },
        {
            "username": "cristian", 
            "password": "cristianjay123!", 
            "role": "manager"   # Can approve/disburse loans & view dashboard
        },
        {
            "username": "paulo", 
            "password": "paulo123!", 
            "role": "teller"    # Can apply for loans & accept payments
        }
    ]

    print(f"--- Connecting to database at: {DB_PATH} ---")

    with conn.connect() as connection:
        print("Ensuring 'users' table exists with new schema...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'teller',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))

        print("Clearing old users...")
        connection.execute(text("DELETE FROM users"))
        
        for account in staff_accounts:
            # Hash the password
            secure_hash = generate_password_hash(account["password"], method='pbkdf2:sha256')
            
            print(f"Creating user: {account['username']} | Role: {account['role']}")
            
            # Insert with Role
            connection.execute(
                text("INSERT INTO users (username, password, role) VALUES (:u, :p, :r)"),
                {"u": account["username"], "p": secure_hash, "r": account["role"]}
            )
            
        connection.commit()
    
    print("--- Success! Users seeded with Roles and Hashed Passwords. ---")

if __name__ == "__main__":
    with app.app_context():
        seed_users()