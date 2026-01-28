CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(20),
    password VARCHAR(30),
    CONSTRAINT pk_users PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS applicants (
    applicant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(30),
    middle_name VARCHAR(30), --WHAT IF WALAY MIDDLE NAME SI APPLICANT?
    last_name VARCHAR(30),
    email VARCHAR(50),
    phone_num VARCHAR(15),
    employment_status VARCHAR(20),
    salary REAL,
    credit_score REAL
);

CREATE TABLE IF NOT EXISTS loan_plans (
    plan_level INTEGER PRIMARY KEY AUTOINCREMENT,
    min_amount REAL,
    max_amount REAL,
    interest_rate REAL
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id INTEGER ,
    loan_plan_lvl INTEGER ,
    principal REAL,
    total_loan REAL,
    payment_amount REAL,
    application_date DATETIME,
    payment_start_date DATETIME NULL, --NULLABLE
    payment_time_period INT,
    payment_schedule VARCHAR(10),
    status VARCHAR(20),
    CONSTRAINT fk_loan_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id),
    CONSTRAINT fk_loan_plan FOREIGN KEY (loan_plan_lvl) REFERENCES loan_plans(plan_level)
);


-- SELECT 
--     loan_id AS id,
--     CONCAT(first_name, ' ', last_name) AS applicantName,
--     application_date AS startDate,
--     payment_time_period AS duration,
--     total_loan AS amount,
--     status,
--     email,
--     application_date AS dateApplied
-- FROM loans l
-- LEFT JOIN applicants a
-- ON l.applicant_id = a.applicant_id;


-- SELECT l.applicant_id, ld.interest_rate, principal, payment_time_period
-- FROM applicants a 
-- LEFT JOIN loans l ON l.applicant_id = a.applicant_id 
-- LEFT JOIN loan_details ld ON ld.plan_lvl = l.loan_plan_lvl
-- WHERE a.first_name = :first_name AND
--         a.last_name = :last_name AND
--         a.middle_name = :middle_name

--This mfer right here will use SCD2 baby :*
CREATE TABLE IF NOT EXISTS loan_details (
    loan_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER ,
    due_amount REAL,
    next_due DATETIME,
    amount_payable REAL,
    payments_remaining INTEGER,
    is_current INTEGER, --CONVERT TO BOOLEAN LATER
    CONSTRAINT fk_loan_details FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

CREATE TABLE IF NOT EXISTS loan_details (
    loan_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER ,
    next_due DATETIME,
    balance REAL,
    payments_remaining INTEGER,
    is_current INTEGER, --CONVERT TO BOOLEAN LATER
    CONSTRAINT fk_loan_details FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    amount_paid REAL,
    remarks VARCHAR,
    transaction_date DATETIME,
    CONSTRAINT fk_payments FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);



INSERT INTO users (username, password) VALUES ('admin', 'password123');
-- SELECT * FROM users;

INSERT INTO loan_plans (plan_level, min_amount, max_amount, interest_rate) VALUES
(1, 5000, 10000, 5),
(2, 10001, 20000, 8),
(3, 20001, 30000, 12),
(4, 30001, 40000, 15),
(5, 40001, 50000, 18);


INSERT INTO 
-- SELECT *
-- FROM loan_plans;


DROP TABLE applicants;
DROP TABLE users;
DROP TABLE loan_plans;
DROP TABLE loans;
DROP TABLE loan_details;
DROP TABLE payments;