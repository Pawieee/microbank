CREATE TABLE users (
    username VARCHAR(20),
    password VARCHAR(30),
    CONSTRAINT pk_users PRIMARY KEY (username)
);

INSERT INTO users (username, password) VALUES ('admin', 'password123');
SELECT * FROM users;