USE sre_app;

-- Default user credentials:
-- Email: admin@example.com
-- Password: admin123
-- 
-- To verify this hash works, run: docker-compose exec api node verify-password.js
-- To regenerate hash: docker-compose exec api node -e "const bcrypt=require('bcrypt');bcrypt.hash('admin123',10).then(h=>console.log(h));"
INSERT INTO users (email, password_hash) 
VALUES ('admin@example.com', '$2b$10$k/cF8GUSdKeSF/vBJZo7LO2yn18.EYoTDlTAGQSBwig8owkDln3Vy')
ON DUPLICATE KEY UPDATE email = email, password_hash = VALUES(password_hash);

