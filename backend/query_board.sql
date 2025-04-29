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


-- DROP TABLE applicants;
-- DROP TABLE users;
-- DROP TABLE loan_plans;
-- DROP TABLE loans;
-- DROP TABLE loan_details;
-- DROP TABLE payments;



-- DUMP DATA RANI PAU FOR TESTING :)
INSERT INTO applicants (first_name, middle_name, last_name, email, phone_num, employment_status, salary, credit_score)
VALUES
('Jack', 'Star', 'Doe', 'jack.star@umindanao.edu.ph', '09123456789', 'Employed', 9450.0, 750),
('John', NULL, 'Doe', 'john.doe@example.com', '09122334455', 'Self-Employed', 15000.0, 700),
('Mary', 'Ann', 'Smith', 'mary.smith@example.com', '09223344556', 'Employed', 12000.0, 720),
('Jane', 'Marie', 'Johnson', 'jane.johnson@example.com', '09334455667', 'Freelancer', 18000.0, 710),
('James', NULL, 'Taylor', 'james.taylor@example.com', '09445566778', 'Employed', 8000.0, 680),
('Emily', 'Rose', 'Brown', 'emily.brown@example.com', '09556677889', 'Employed', 11000.0, 760),
('Robert', 'Lee', 'Williams', 'robert.williams@example.com', '09667788990', 'Self-Employed', 13000.0, 720),
('Olivia', 'Jane', 'Davis', 'olivia.davis@example.com', '09778899001', 'Freelancer', 14000.0, 710),
('Michael', 'Scott', 'Miller', 'michael.miller@example.com', '09889900112', 'Employed', 9500.0, 740),
('Sophia', NULL, 'Garcia', 'sophia.garcia@example.com', '09990011223', 'Self-Employed', 10500.0, 700),
('Liam', 'Noah', 'Rodriguez', 'liam.rodriguez@example.com', '09101122334', 'Freelancer', 16000.0, 725),
('Isabella', 'Grace', 'Martinez', 'isabella.martinez@example.com', '09112233445', 'Employed', 10500.0, 715),
('Benjamin', NULL, 'Hernandez', 'benjamin.hernandez@example.com', '09223344556', 'Self-Employed', 11000.0, 735),
('Amelia', 'Claire', 'Lopez', 'amelia.lopez@example.com', '09334455667', 'Freelancer', 12500.0, 750),
('Lucas', 'James', 'Gonzalez', 'lucas.gonzalez@example.com', '09445566778', 'Employed', 13000.0, 760),
('Charlotte', 'Grace', 'Wilson', 'charlotte.wilson@example.com', '09556677889', 'Employed', 14000.0, 730),
('Ethan', 'Michael', 'Anderson', 'ethan.anderson@example.com', '09667788990', 'Self-Employed', 9500.0, 705),
('Mia', 'Marie', 'Thomas', 'mia.thomas@example.com', '09778899001', 'Freelancer', 11000.0, 720),
('Alexander', 'Christopher', 'Taylor', 'alexander.taylor@example.com', '09889900112', 'Employed', 12000.0, 735),
('Amelia', 'Jane', 'Moore', 'amelia.moore@example.com', '09990011223', 'Self-Employed', 12500.0, 740),
('Logan', 'Oliver', 'Jackson', 'logan.jackson@example.com', '09101122334', 'Freelancer', 13000.0, 710),
('Grace', 'Elaine', 'Martin', 'grace.martin@example.com', '09112233445', 'Employed', 14000.0, 725),
('Elijah', 'Mark', 'Lee', 'elijah.lee@example.com', '09223344556', 'Self-Employed', 15000.0, 755),
('Avery', 'Sue', 'Perez', 'avery.perez@example.com', '09334455667', 'Freelancer', 10500.0, 700),
('Chloe', 'Marie', 'Wilson', 'chloe.wilson@example.com', '09445566778', 'Employed', 11500.0, 710),
('Aiden', 'Joseph', 'Hernandez', 'aiden.hernandez@example.com', '09556677889', 'Self-Employed', 12000.0, 715),
('Scarlett', 'Elaine', 'Sanchez', 'scarlett.sanchez@example.com', '09667788990', 'Freelancer', 12500.0, 735),
('Matthew', 'Daniel', 'Kim', 'matthew.kim@example.com', '09778899001', 'Employed', 13000.0, 750),
('Victoria', 'Helen', 'Clark', 'victoria.clark@example.com', '09889900112', 'Self-Employed', 14000.0, 765),
('Jackson', 'David', 'Lewis', 'jackson.lewis@example.com', '09990011223', 'Freelancer', 15000.0, 720),
('Harper', 'Louise', 'Young', 'harper.young@example.com', '09101122334', 'Employed', 16000.0, 740),
('Henry', 'Alexander', 'Walker', 'henry.walker@example.com', '09112233445', 'Self-Employed', 10500.0, 700),
('Zoe', 'Grace', 'King', 'zoe.king@example.com', '09223344556', 'Freelancer', 11000.0, 725),
('Isaac', 'Benjamin', 'Wright', 'isaac.wright@example.com', '09334455667', 'Employed', 11500.0, 745),
('Lily', 'Sophia', 'Adams', 'lily.adams@example.com', '09445566778', 'Self-Employed', 12000.0, 730),
('Jack', 'David', 'Nelson', 'jack.nelson@example.com', '09556677889', 'Freelancer', 12500.0, 735),
('Nora', 'Alice', 'Carter', 'nora.carter@example.com', '09667788990', 'Employed', 13000.0, 755),
('William', 'Thomas', 'Mitchell', 'william.mitchell@example.com', '09778899001', 'Self-Employed', 13500.0, 765),
('Ava', 'Grace', 'Roberts', 'ava.roberts@example.com', '09889900112', 'Freelancer', 14000.0, 740),
('Owen', 'Patrick', 'Scott', 'owen.scott@example.com', '09990011223', 'Employed', 14500.0, 750),
('Emily', 'Jane', 'Morris', 'emily.morris@example.com', '09101122334', 'Self-Employed', 15000.0, 760),
('Daniel', 'Luke', 'Graham', 'daniel.graham@example.com', '09112233445', 'Freelancer', 15500.0, 765),
('Eleanor', 'Ruth', 'Garcia', 'eleanor.garcia@example.com', '09223344556', 'Employed', 16000.0, 770),
('Sebastian', 'Mark', 'Harris', 'sebastian.harris@example.com', '09334455667', 'Self-Employed', 16500.0, 780),
('Chloe', 'Grace', 'Lee', 'chloe.lee@example.com', '09445566778', 'Freelancer', 17000.0, 790),
('Samuel', 'Eli', 'Walker', 'samuel.walker@example.com', '09556677889', 'Employed', 17500.0, 800),
('Eva', 'Marie', 'Young', 'eva.young@example.com', '09667788990', 'Self-Employed', 18000.0, 810),
('Luke', 'Gabriel', 'Hernandez', 'luke.hernandez@example.com', '09778899001', 'Freelancer', 18500.0, 820),
('Leah', 'Rose', 'Nelson', 'leah.nelson@example.com', '09889900112', 'Employed', 19000.0, 830),
('Mason', 'Eli', 'King', 'mason.king@example.com', '09990011223', 'Self-Employed', 19500.0, 840),
('Victoria', 'Olivia', 'Martinez', 'victoria.martinez@example.com', '09101122334', 'Freelancer', 20000.0, 850);

-- Insert data into loans table with random values for status, payment_schedule, and payment_time_period
INSERT INTO loans (applicant_id, loan_plan_lvl, principal, total_loan, payment_amount, application_date, payment_start_date, payment_time_period, payment_schedule, status)
VALUES
(1, 1, 9450.0, 9450.0, 1580.0, '2025-04-29 00:45:20.884104', '2025-05-01 00:00:00', 12, 'Monthly', 'Completed'),
(2, 2, 15000.0, 15000.0, 2500.0, '2025-04-29 01:00:10.123456', '2025-05-01 00:00:00', 6, 'Bi-Weekly', 'Pending'),
(3, 3, 12000.0, 12000.0, 2000.0, '2025-04-29 01:10:25.789234', '2025-05-01 00:00:00', 24, 'Monthly', 'Approved'),
(4, 1, 18000.0, 18000.0, 3000.0, '2025-04-29 01:30:45.456789', '2025-05-01 00:00:00', 36, 'Weekly', 'Completed'),
(5, 2, 8000.0, 8000.0, 1333.33, '2025-04-29 02:00:55.543210', '2025-05-01 00:00:00', 6, 'Bi-Weekly', 'Pending'),
(6, 3, 11000.0, 11000.0, 1833.33, '2025-04-29 02:10:12.123987', '2025-05-01 00:00:00', 12, 'Weekly', 'Pending'),
(7, 1, 13000.0, 13000.0, 2166.67, '2025-04-29 02:20:24.987654', '2025-05-01 00:00:00', 36, 'Bi-Weekly', 'Completed'),
(8, 2, 14000.0, 14000.0, 2333.33, '2025-04-29 02:30:47.456321', '2025-05-01 00:00:00', 12, 'Monthly', 'Approved'),
(9, 1, 9500.0, 9500.0, 1583.33, '2025-04-29 02:40:59.789432', '2025-05-01 00:00:00', 6, 'Bi-Weekly', 'Pending'),
(10, 2, 10500.0, 10500.0, 1750.0, '2025-04-29 02:50:01.234765', '2025-05-01 00:00:00', 24, 'Monthly', 'Pending'),
(11, 3, 9500.0, 9500.0, 1583.33, '2025-04-29 03:00:15.456987', '2025-05-01 00:00:00', 3, 'Weekly', 'Completed'),
(12, 1, 12000.0, 12000.0, 2000.0, '2025-04-29 03:10:25.789654', '2025-05-01 00:00:00', 6, 'Monthly', 'Approved'),
(13, 2, 12500.0, 12500.0, 2083.33, '2025-04-29 03:20:35.123987', '2025-05-01 00:00:00', 24, 'Bi-Weekly', 'Pending'),
(14, 3, 11000.0, 11000.0, 1833.33, '2025-04-29 03:30:45.987654', '2025-05-01 00:00:00', 12, 'Monthly', 'Completed'),
(15, 1, 10000.0, 10000.0, 1666.67, '2025-04-29 03:40:55.234321', '2025-05-01 00:00:00', 36, 'Weekly', 'Approved'),
(16, 2, 11500.0, 11500.0, 1916.67, '2025-04-29 03:50:12.123765', '2025-05-01 00:00:00', 24, 'Bi-Weekly', 'Completed'),
(17, 3, 10500.0, 10500.0, 1750.0, '2025-04-29 04:00:35.234876', '2025-05-01 00:00:00', 12, 'Monthly', 'Approved'),
(18, 1, 15000.0, 15000.0, 2500.0, '2025-04-29 04:10:45.987321', '2025-05-01 00:00:00', 24, 'Weekly', 'Completed'),
(19, 2, 8000.0, 8000.0, 1333.33, '2025-04-29 04:20:55.123654', '2025-05-01 00:00:00', 6, 'Bi-Weekly', 'Pending'),
(20, 3, 13000.0, 13000.0, 2166.67, '2025-04-29 04:30:10.234321', '2025-05-01 00:00:00', 12, 'Monthly', 'Completed'),
(21, 1, 12000.0, 12000.0, 2000.0, '2025-04-29 04:40:21.123987', '2025-05-01 00:00:00', 6, 'Weekly', 'Approved'),
(22, 2, 11500.0, 11500.0, 1916.67, '2025-04-29 04:50:31.987654', '2025-05-01 00:00:00', 36, 'Bi-Weekly', 'Pending'),
(23, 3, 10000.0, 10000.0, 1666.67, '2025-04-29 05:00:41.234765', '2025-05-01 00:00:00', 24, 'Monthly', 'Completed'),
(24, 1, 11000.0, 11000.0, 1833.33, '2025-04-29 05:10:51.234876', '2025-05-01 00:00:00', 3, 'Weekly', 'Pending'),
(25, 2, 9500.0, 9500.0, 1583.33, '2025-04-29 05:20:01.123987', '2025-05-01 00:00:00', 12, 'Bi-Weekly', 'Completed'),
(26, 3, 12000.0, 12000.0, 2000.0, '2025-04-29 05:30:11.234876', '2025-05-01 00:00:00', 6, 'Monthly', 'Approved'),
(27, 1, 11500.0, 11500.0, 1916.67, '2025-04-29 05:40:21.987654', '2025-05-01 00:00:00', 24, 'Weekly', 'Pending'),
(28, 2, 13000.0, 13000.0, 2166.67, '2025-04-29 05:50:31.234987', '2025-05-01 00:00:00', 12, 'Monthly', 'Completed'),
(29, 3, 10000.0, 10000.0, 1666.67, '2025-04-29 06:00:41.234765', '2025-05-01 00:00:00', 36, 'Weekly', 'Pending'),
(30, 1, 10500.0, 10500.0, 1750.0, '2025-04-29 06:10:51.234876', '2025-05-01 00:00:00', 12, 'Bi-Weekly', 'Approved'),
(31, 2, 11000.0, 11000.0, 1833.33, '2025-04-29 06:20:01.123987', '2025-05-01 00:00:00', 24, 'Weekly', 'Completed'),
(32, 3, 12000.0, 12000.0, 2000.0, '2025-04-29 06:30:11.234321', '2025-05-01 00:00:00', 6, 'Bi-Weekly', 'Pending'),
(33, 1, 9500.0, 9500.0, 1583.33, '2025-04-29 06:40:21.987654', '2025-05-01 00:00:00', 12, 'Monthly', 'Approved'),
(34, 2, 11500.0, 11500.0, 1916.67, '2025-04-29 06:50:31.234876', '2025-05-01 00:00:00', 36, 'Bi-Weekly', 'Completed'),
(35, 3, 10000.0, 10000.0, 1666.67, '2025-04-29 07:00:41.234321', '2025-05-01 00:00:00', 3, 'Weekly', 'Pending'),
(36, 1, 13000.0, 13000.0, 2166.67, '2025-04-29 07:10:51.234987', '2025-05-01 00:00:00', 24, 'Monthly', 'Completed'),
(37, 2, 14000.0, 14000.0, 2333.33, '2025-04-29 07:20:01.234765', '2025-05-01 00:00:00', 12, 'Bi-Weekly', 'Approved'),
(38, 3, 11000.0, 11000.0, 1833.33, '2025-04-29 07:30:11.987654', '2025-05-01 00:00:00', 36, 'Weekly', 'Pending'),
(39, 1, 12500.0, 12500.0, 2083.33, '2025-04-29 07:40:21.234987', '2025-05-01 00:00:00', 6, 'Monthly', 'Completed'),
(40, 2, 13000.0, 13000.0, 2166.67, '2025-04-29 07:50:31.987654', '2025-05-01 00:00:00', 12, 'Weekly', 'Approved'),
(41, 3, 13500.0, 13500.0, 2250.0, '2025-04-29 08:00:41.234765', '2025-05-01 00:00:00', 24, 'Bi-Weekly', 'Pending'),
(42, 1, 11000.0, 11000.0, 1833.33, '2025-04-29 08:10:51.234321', '2025-05-01 00:00:00', 36, 'Weekly', 'Completed'),
(43, 2, 11500.0, 11500.0, 1916.67, '2025-04-29 08:20:01.234876', '2025-05-01 00:00:00', 6, 'Bi-Weekly', 'Approved'),
(44, 3, 10000.0, 10000.0, 1666.67, '2025-04-29 08:30:11.234987', '2025-05-01 00:00:00', 12, 'Monthly', 'Pending'),
(45, 1, 12000.0, 12000.0, 2000.0, '2025-04-29 08:40:21.234765', '2025-05-01 00:00:00', 24, 'Weekly', 'Completed'),
(46, 2, 12500.0, 12500.0, 2083.33, '2025-04-29 08:50:31.987654', '2025-05-01 00:00:00', 6, 'Monthly', 'Approved'),
(47, 3, 14000.0, 14000.0, 2333.33, '2025-04-29 09:00:41.234987', '2025-05-01 00:00:00', 36, 'Weekly', 'Pending'),
(48, 1, 11000.0, 11000.0, 1833.33, '2025-04-29 09:10:51.234765', '2025-05-01 00:00:00', 24, 'Bi-Weekly', 'Completed'),
(49, 2, 10500.0, 10500.0, 1750.0, '2025-04-29 09:20:01.234321', '2025-05-01 00:00:00', 6, 'Weekly', 'Approved'),
(50, 3, 15000.0, 15000.0, 2500.0, '2025-04-29 09:30:11.234987', '2025-05-01 00:00:00', 12, 'Monthly', 'Pending');
