USE sre_app;

-- Password: admin123
-- Generated with: bcrypt.hash('admin123', 10)
INSERT INTO users (email, password_hash) 
VALUES ('admin@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON DUPLICATE KEY UPDATE email = email, password_hash = VALUES(password_hash);

