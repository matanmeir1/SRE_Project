USE sre_app;

INSERT INTO users (email) 
VALUES ('admin@example.com')
ON DUPLICATE KEY UPDATE email = email;

