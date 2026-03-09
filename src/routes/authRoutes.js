import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const result = await pool.query(
    "SELECT id, username, password_hash, role FROM users WHERE username = $1",
    [username]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.post("/users", authMiddleware, requireRole("admin"), async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const normalizedRole = role === "admin" ? "admin" : "technician";

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at`,
      [username.trim(), passwordHash, normalizedRole]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    // 23505 is PostgreSQL's unique_violation
    if (error.code === "23505") {
      return res.status(409).json({ error: "username already exists" });
    }
    throw error;
  }
});

router.get("/users", authMiddleware, requireRole("admin"), async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
  );
  return res.json(result.rows);
});

export default router;
