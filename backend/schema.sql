-- ==========================================
-- 1. DROP OLD TABLES
-- ==========================================
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS loan_details;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS loan_plans;
DROP TABLE IF EXISTS applicants;
DROP TABLE IF EXISTS audit_logs; 
DROP TABLE IF EXISTS users;

-- ==========================================
-- 2. CREATE NEW TABLES
-- ==========================================

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teller',
    status VARCHAR(20) DEFAULT 'active',
    is_first_login BOOLEAN DEFAULT 1, 
    failed_login_attempts INTEGER DEFAULT 0,
    lockout_until DATETIME, -- ✅ Added for Rate Limiting
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50),
    action VARCHAR(50),
    target_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applicants (
    applicant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),   
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    civil_status VARCHAR(20),
    email VARCHAR(100),
    phone_num VARCHAR(20),
    address TEXT,
    
    -- UPDATED: Stores the actual Base64 Image String
    id_type VARCHAR(50),
    id_image_data TEXT, 
    
    employment_status VARCHAR(50),
    monthly_income REAL,
    credit_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loan_plans (
    plan_level INTEGER PRIMARY KEY AUTOINCREMENT,
    min_amount REAL,
    max_amount REAL,
    interest_rate REAL
);

CREATE TABLE loans (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id INTEGER NOT NULL,
    loan_plan_lvl INTEGER,
    principal REAL,
    total_loan REAL,                 
    payment_amount REAL,             
    loan_purpose VARCHAR(100),       
    disbursement_method VARCHAR(50), 
    disbursement_account_number VARCHAR(50), 
    application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_start_date DATETIME,
    payment_time_period INTEGER,
    payment_schedule VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Pending', 
    remarks TEXT,
    FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id),
    FOREIGN KEY (loan_plan_lvl) REFERENCES loan_plans(plan_level)
);

CREATE TABLE loan_details (
    loan_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    balance REAL,              
    due_amount REAL,           
    next_due DATETIME,
    payments_remaining INTEGER,
    is_current BOOLEAN DEFAULT 1, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    amount_paid REAL NOT NULL,
    remarks TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(50), 
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

-- ==========================================
-- 3. SEED INITIAL DATA
-- ==========================================
INSERT INTO loan_plans (plan_level, min_amount, max_amount, interest_rate) VALUES
(1, 5000, 10000, 5),
(2, 10001, 20000, 8),
(3, 20001, 30000, 12),
(4, 30001, 40000, 15),
(5, 40001, 50000, 18);