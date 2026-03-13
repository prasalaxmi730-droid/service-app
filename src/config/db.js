import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (typeof connectionString !== "string" || connectionString.trim() === "") {
  throw new Error(
    "DATABASE_URL is missing or invalid. Set a valid PostgreSQL connection string in .env"
  );
}

const ssl =
  process.env.DATABASE_SSL === "false" ||
  /localhost|127\.0\.0\.1/i.test(connectionString)
    ? false
    : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  ssl,
});

pool.on("error", err => {
  console.error("Unexpected PostgreSQL pool error", err);
});

export const query = (text, params = []) => pool.query(text, params);
export const getClient = () => pool.connect();
export const poolPromise = Promise.resolve(pool);
