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
        {"username": "admin", "password": "MicroBank123!"},
        {"username": "cristian", "password": "cristianjay123!"},
        {"username": "paulo", "password": "paulo123!"}
    ]

    print(f"--- Connecting to database at: {DB_PATH} ---")

    with conn.connect() as connection:
        print("Checking/Creating table...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            );
        """))

        # Clear old data to prevent duplicates
        print("Clearing old users...")
        connection.execute(text("DELETE FROM users"))
        
        # Insert new hashed users
        for account in staff_accounts:
            secure_hash = generate_password_hash(account["password"], method='pbkdf2:sha256')
            
            print(f"Creating user: {account['username']}")
            connection.execute(
                text("INSERT INTO users (username, password) VALUES (:u, :p)"),
                {"u": account["username"], "p": secure_hash}
            )
            
        connection.commit()
    
    print("--- Success! Passwords are now hashed and stored. ---")

if __name__ == "__main__":
    with app.app_context():
        seed_users()