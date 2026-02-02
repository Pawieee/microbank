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
            "username": "admin.jay", 
            "password": "admin.jay", 
            "role": "admin",
            "full_name": "Cristian Jay Cosep"
        }
    ]

    print(f"--- Connecting to database at: {DB_PATH} ---")

    with conn.connect() as connection:
        # 1. Safety Check: Ensure table exists with NEW schema
        # (Ideally schema.sql handles this, but this serves as a backup)
        print("Ensuring 'users' table schema...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'teller',
                status VARCHAR(20) DEFAULT 'active',
                failed_login_attempts INTEGER DEFAULT 0,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # 2. Clear old data
        print("Clearing old users...")
        connection.execute(text("DELETE FROM users"))
        
        # 3. Insert the Admin
        for account in staff_accounts:
            # Hash the password
            secure_hash = generate_password_hash(account["password"], method='pbkdf2:sha256')
            
            print(f"Creating user: {account['username']} | Role: {account['role']}")
            
            # Insert with new fields (full_name, status, failed_attempts)
            connection.execute(
                text("""
                    INSERT INTO users (username, password, role, full_name, status, failed_login_attempts) 
                    VALUES (:u, :p, :r, :fn, 'active', 0)
                """),
                {
                    "u": account["username"], 
                    "p": secure_hash, 
                    "r": account["role"],
                    "fn": account["full_name"]
                }
            )
            
        connection.commit()
    
    print("--- Success! Admin seeded. You can now log in. ---")

if __name__ == "__main__":
    with app.app_context():
        seed_users()