const express = require("express");
const router = express.Router();
const pool = require("../db");

// Получить все операции пользователя
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query(
      `
            SELECT o.id, o.amount, o.description, o.type, o.operation_date, c.name as category
            FROM operations o
            JOIN categories c ON o.category_id = c.id
            WHERE o.user_id = $1
            ORDER BY o.operation_date DESC
        `,
      [userId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить операцию
router.post("/", async (req, res) => {
  const { userId, categoryName, amount, description, type } = req.body;
  try {
    const catRes = await pool.query(
      "SELECT id FROM categories WHERE name = $1",
      [categoryName],
    );
    if (catRes.rows.length === 0)
      return res.status(400).json({ error: "Категория не найдена" });
    const categoryId = catRes.rows[0].id;
    const result = await pool.query(
      `
            INSERT INTO operations (user_id, category_id, amount, description, type)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `,
      [userId, categoryId, amount, description, type],
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить операцию по ID
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM operations WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Очистить все операции пользователя
router.delete("/user/:userId", async (req, res) => {
  try {
    await pool.query("DELETE FROM operations WHERE user_id = $1", [
      req.params.userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
