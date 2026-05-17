const express = require("express");
const router = express.Router();
const pool = require("../db");

// Получить лимиты пользователя на текущий месяц
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  try {
    const { rows } = await pool.query(
      `
            SELECT c.name as category, l.month_limit
            FROM limits l
            JOIN categories c ON l.category_id = c.id
            WHERE l.user_id = $1 AND l.year = $2 AND l.month = $3
        `,
      [userId, year, month],
    );
    const limits = {};
    rows.forEach((row) => {
      limits[row.category] = row.month_limit;
    });
    res.json(limits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Установить или удалить лимит
router.post("/", async (req, res) => {
  const { userId, categoryName, monthLimit, year, month } = req.body;
  try {
    const catRes = await pool.query(
      "SELECT id FROM categories WHERE name = $1",
      [categoryName],
    );
    if (catRes.rows.length === 0)
      return res.status(400).json({ error: "Категория не найдена" });
    const categoryId = catRes.rows[0].id;
    if (monthLimit && monthLimit > 0) {
      await pool.query(
        `
                INSERT INTO limits (user_id, category_id, month_limit, year, month)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, category_id, year, month) DO UPDATE SET month_limit = EXCLUDED.month_limit
            `,
        [userId, categoryId, monthLimit, year, month],
      );
    } else {
      await pool.query(
        `
                DELETE FROM limits WHERE user_id = $1 AND category_id = $2 AND year = $3 AND month = $4
            `,
        [userId, categoryId, year, month],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
