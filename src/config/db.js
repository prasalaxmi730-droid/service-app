import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (typeof connectionString !== "string" || connectionString.trim() === "") {
  throw new Error(
    "DATABASE_URL is missing or invalid. Set a valid SQL Server connection string in .env"
  );
}

// Global pool promise to reuse the connection
const poolPromise = new sql.ConnectionPool(connectionString)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });

export { sql, poolPromise };
