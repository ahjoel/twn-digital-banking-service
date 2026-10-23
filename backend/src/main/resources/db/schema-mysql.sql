-- users table schema + default user for MySQL (digitalbankingdb database)
CREATE DATABASE IF NOT EXISTS digitalbankingdb;
USE digitalbankingdb;

CREATE TABLE IF NOT EXISTS users (
    id       BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,          -- BCrypt hash
    email    VARCHAR(150),
    role     VARCHAR(50)  NOT NULL DEFAULT 'CUSTOMER',
    enabled  BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default user: tom@mybank.com / tom (password stored as a BCrypt hash)
INSERT IGNORE INTO users (username, password, email, role, enabled)
VALUES ('tom@mybank.com', '$2a$10$Ji0sfMyMiSTfua9RqFyUqeU57iSf2PGuR308JTL5dncjxCVZK/bAm', 'tom@mybank.com', 'CUSTOMER', TRUE);
