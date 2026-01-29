-- ==========================================
-- 1. DROP OLD TABLES (Order matters for Foreign Keys)
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

-- USERS: Updated for User Management Features
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identity
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,    -- NEW: To identify real person (e.g. "Juan Dela Cruz")
    
    -- Access Control
    role VARCHAR(20) NOT NULL DEFAULT 'teller', -- 'teller', 'manager', 'admin'
    status VARCHAR(20) DEFAULT 'active',        -- NEW: 'active', 'suspended', 'locked'
    
    -- Security & Audit
    failed_login_attempts INTEGER DEFAULT 0,    -- NEW: For auto-locking after 5 fails
    last_login DATETIME,                        -- NEW: To track inactivity
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOGS: Tracks all sensitive actions
CREATE TABLE audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50),      -- Who did it?
    action VARCHAR(50),        -- What did they do? (e.g., 'USER_SUSPENDED', 'DISBURSE_LOAN')
    target_id VARCHAR(50),     -- Which record? (e.g., 'user_id: 5', 'loan_id: 101')
    details TEXT,              -- Extra info
    ip_address VARCHAR(45),    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    -- Removed Foreign Key constraint to username to allow logs to persist even if user is deleted (rare)
);

-- APPLICANTS
CREATE TABLE applicants (
    applicant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),   
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone_num VARCHAR(20),
    employment_status VARCHAR(50),
    salary REAL,
    credit_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LOAN PLANS
CREATE TABLE loan_plans (
    plan_level INTEGER PRIMARY KEY AUTOINCREMENT,
    min_amount REAL,
    max_amount REAL,
    interest_rate REAL
);

-- LOANS
CREATE TABLE loans (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id INTEGER NOT NULL,
    loan_plan_lvl INTEGER,
    principal REAL,
    total_loan REAL,           
    payment_amount REAL,       
    application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_start_date DATETIME,
    payment_time_period INTEGER, 
    payment_schedule VARCHAR(20), 
    status VARCHAR(20) DEFAULT 'Pending', 
    FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id),
    FOREIGN KEY (loan_plan_lvl) REFERENCES loan_plans(plan_level)
);

-- LOAN DETAILS
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

-- PAYMENTS
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

-- Loan Plans
INSERT INTO loan_plans (plan_level, min_amount, max_amount, interest_rate) VALUES
(1, 5000, 10000, 5),
(2, 10001, 20000, 8),
(3, 20001, 30000, 12),
(4, 30001, 40000, 15),
(5, 40001, 50000, 18);