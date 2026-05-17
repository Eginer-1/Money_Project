const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// Регистрация
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 4) {
    return res.status(400).json({ error: "Пароль должен быть ≥4 символов" });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
      [username, hashed],
    );
    res.json({ success: true, userId: result.rows[0].id });
  } catch (err) {
    if (err.code === "23505")
      res.status(400).json({ error: "Пользователь уже существует" });
    else res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Логин
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username],
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Неверное имя или пароль" });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "Неверное имя или пароль" });
    res.json({ success: true, userId: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
