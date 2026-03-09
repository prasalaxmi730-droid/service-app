import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (typeof connectionString !== "string" || connectionString.trim() === "") {
  throw new Error(
    "DATABASE_URL is missing or invalid. Set a valid SQL Server connection string in .env"
  );
}

// Support both URL and semicolon formats
let config;
if (connectionString.includes("://")) {
  try {
    const url = new URL(connectionString);
    config = {
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      server: url.hostname,
      database: url.pathname.replace("/", "") || url.searchParams.get("database"),
      port: url.port ? parseInt(url.port, 10) : 1433,
      options: {
        encrypt: true, // Always true for Azure/Render
        trustServerCertificate: true,
      },
    };
  } catch (err) {
    // If URL parsing fails, fallback to treating it as a raw connection string
    config = connectionString;
  }
} else {
  config = connectionString;
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    throw err;
  });

export { sql, poolPromise };
