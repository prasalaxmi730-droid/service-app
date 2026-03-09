import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { poolPromise } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const pool = await poolPromise;
  const result = await pool.request()
    .input("username", username)
    .query("SELECT id, username, password_hash, role FROM users WHERE username = @username");

  if (result.recordset.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.recordset[0];
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
    const pool = await poolPromise;
    const result = await pool.request()
      .input("username", username.trim())
      .input("passwordHash", passwordHash)
      .input("role", normalizedRole)
      .query(`
        INSERT INTO users (username, password_hash, role)
        OUTPUT inserted.id, inserted.username, inserted.role, inserted.created_at
        VALUES (@username, @passwordHash, @role)
      `);

    return res.status(201).json(result.recordset[0]);
  } catch (error) {
    // 2627 is SQL Server's unique constraint violation
    if (error.number === 2627) {
      return res.status(409).json({ error: "username already exists" });
    }
    throw error;
  }
});

router.get("/users", authMiddleware, requireRole("admin"), async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(
    "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
  );
  return res.json(result.recordset);
});

export default router;
