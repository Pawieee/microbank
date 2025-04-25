CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(20),
    password VARCHAR(30),
    CONSTRAINT pk_users PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS applicants (
    applicant_id INT NOT NULL,
    first_name VARCHAR(30),
    middle_name VARCHAR(30), --WHAT IF WALAY MIDDLE NAME SI APPLICANT?
    last_name VARCHAR(30),
    email VARCHAR(50),
    phone_num VARCHAR(15),
    employment_status VARCHAR(20) CHECK(employment_status IN ('Employed', 'Self-Employed', 'Student', 'Unemployed', 'Retired')),
    salary REAL,
    cred_score REAL,
    CONSTRAINT pk_applicants PRIMARY KEY (applicant_id)
);

CREATE TABLE IF NOT EXISTS loan_plans (
    plan_level INT NOT NULL,
    min_amount REAL,
    max_amount REAL,
    interest_rate REAL,
    CONSTRAINT loan_plans PRIMARY KEY (plan_level)

);

CREATE TABLE IF NOT EXISTS loans (
    loan_id INT NOT NULL,
    applicant_id INT,
    loan_plan_lvl INT,
    principal REAL,
    total_loan REAL,
    application_date DATETIME,
    payment_start_date DATETIME NULL, --NULLABLE
    payment_time_period INT,
    payment_schedule VARCHAR(10),
    status VARCHAR(20),
    CONSTRAINT pk_loans PRIMARY KEY (loan_id),
    CONSTRAINT fk_loan_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id),
    CONSTRAINT fk_loan_plan FOREIGN KEY (loan_plan_lvl) REFERENCES loan_plans(plan_level)
);


SELECT l.applicant_id, ld.interest_rate, principal, payment_time_period
FROM applicants a 
LEFT JOIN loans l ON l.applicant_id = a.applicant_id 
LEFT JOIN loan_details ld ON ld.plan_lvl = l.loan_plan_lvl
WHERE a.first_name = :first_name AND
        a.last_name = :last_name AND
        a.middle_name = :middle_name

--This mfer right here will use SCD2 baby :*
CREATE TABLE IF NOT EXISTS loan_details (
    loan_detail_id INT NOT NULL,
    loan_id INT,
    due_amount REAL,
    next_due DATETIME,
    amount_payable REAL,
    is_current INTEGER, --CONVERT TO BOOLEAN LATER
    CONSTRAINT pk_loan_details PRIMARY KEY(loan_detail_id),
    CONSTRAINT fk_loan_details FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT NOT NULL,
    loan_id INT,
    amount_paid REAL,
    remarks VARCHAR,
    transaction_date DATETIME,
    CONSTRAINT pk_payments PRIMARY KEY(payment_id),
    CONSTRAINT fk_payments FOREIGN KEY (loan_id) REFERENCES loans(loan_id)  
);



DROP TABLE applicants;
-- INSERT INTO users (username, password) VALUES ('admin', 'password123');
-- SELECT * FROM users;

INSERT INTO loan_plans (plan_level, min_amount, max_amount, interest_rate) VALUES
(1, 5000, 10000, 5),
(2, 10001, 20000, 8),
(3, 20001, 30000, 12),
(4, 30001, 40000, 15),
(5, 40001, 50000, 18);


SELECT *
FROM loan_plans;