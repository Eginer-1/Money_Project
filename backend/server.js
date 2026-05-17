const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const pool = require("./db");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Импорт роутов
const usersRoutes = require("./routes/users");
const operationsRoutes = require("./routes/operations");
const limitsRoutes = require("./routes/limits");

app.use("/api/users", usersRoutes);
app.use("/api/operations", operationsRoutes);
app.use("/api/limits", limitsRoutes);

// Инициализация БД (таблицы + demo-пользователь)
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense'))
            );
            CREATE TABLE IF NOT EXISTS operations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER NOT NULL REFERENCES categories(id),
                amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
                description TEXT,
                operation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense'))
            );
            CREATE TABLE IF NOT EXISTS limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER NOT NULL REFERENCES categories(id),
                month_limit DECIMAL(10,2) NOT NULL,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
                UNIQUE(user_id, category_id, year, month)
            );
        `);
    console.log("✅ Таблицы созданы/проверены");

    const categories = [
      ["Еда", "expense"],
      ["Транспорт", "expense"],
      ["Коммунальные", "expense"],
      ["Развлечения", "expense"],
      ["Зарплата", "income"],
    ];
    for (const [name, type] of categories) {
      await client.query(
        "INSERT INTO categories (name, type) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
        [name, type],
      );
    }

    const { rows } = await client.query(
      "SELECT id FROM users WHERE username = $1",
      ["demo"],
    );
    if (rows.length === 0) {
      const hash = await bcrypt.hash("123456", 10);
      await client.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
        ["demo", hash],
      );
      console.log("✅ Демо-пользователь создан (demo / 123456)");
    }
  } catch (err) {
    console.error("❌ Ошибка инициализации БД:", err);
  } finally {
    client.release();
  }
}
initDB();

app.listen(PORT, () => {
  console.log(`🚀 Сервер FinControl запущен на http://localhost:${PORT}`);
});
