-- Создание базы данных (выполните отдельно, если её нет)
-- CREATE DATABASE fincontrol;

-- Подключитесь к базе fincontrol, затем выполните:

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(10)
);

-- Таблица операций
CREATE TABLE IF NOT EXISTS operations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Таблица лимитов
CREATE TABLE IF NOT EXISTS limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month DATE NOT NULL,
    limit_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(user_id, category_id, month)
);

-- Вставка начальных данных
INSERT INTO users (username, password_hash) VALUES ('demo', '123456')
ON CONFLICT (username) DO NOTHING;

INSERT INTO categories (name, type, icon) VALUES
    ('Еда', 'expense', '🍎'),
    ('Транспорт', 'expense', '🚗'),
    ('Коммунальные', 'expense', '💡'),
    ('Развлечения', 'expense', '🎬'),
    ('Зарплата', 'income', '💼'),
    ('Прочее', 'expense', '📌')
ON CONFLICT (name) DO NOTHING;

-- Вставка тестовых операций (предполагаем, что id пользователя demo = 1, категории уже вставлены)
INSERT INTO operations (user_id, category_id, amount, type, description, date) VALUES
    (1, (SELECT id FROM categories WHERE name='Еда'), 850, 'expense', 'Продукты', '2026-05-01'),
    (1, (SELECT id FROM categories WHERE name='Зарплата'), 50000, 'income', 'Зарплата', '2026-05-01'),
    (1, (SELECT id FROM categories WHERE name='Транспорт'), 300, 'expense', 'Такси', '2026-05-02'),
    (1, (SELECT id FROM categories WHERE name='Еда'), 200, 'expense', 'Кофе', '2026-05-03');

-- Вставка лимитов
INSERT INTO limits (user_id, category_id, month, limit_amount) VALUES
    (1, (SELECT id FROM categories WHERE name='Еда'), '2026-05-01', 10000),
    (1, (SELECT id FROM categories WHERE name='Транспорт'), '2026-05-01', 5000)
ON CONFLICT (user_id, category_id, month) DO NOTHING;