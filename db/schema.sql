-- Create Event Registration Database
CREATE DATABASE IF NOT EXISTS event_registration_db;
USE event_registration_db;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    industry VARCHAR(255)
);

-- Table: event_history
CREATE TABLE IF NOT EXISTS event_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('RECOMMENDATION', 'CHECKLIST', 'QUOTATION') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
