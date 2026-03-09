import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (typeof connectionString !== "string" || connectionString.trim() === "") {
  throw new Error(
    "DATABASE_URL is missing or invalid. Set a valid PostgreSQL connection string in .env"
  );
}

const pool = new pg.Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});

export { pool };
