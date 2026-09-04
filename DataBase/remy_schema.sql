CREATE DATABASE IF NOT EXISTS remy_db;

USE remy_db;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE ingredients (
    ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100)
);

CREATE TABLE user_ingredients (
    user_ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    expiration_date DATE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE
);

CREATE TABLE user_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_name VARCHAR(100) NOT NULL,
    preference_value VARCHAR(255),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);