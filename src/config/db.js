import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (typeof connectionString !== "string" || connectionString.trim() === "") {
  throw new Error(
    "DATABASE_URL is missing or invalid. Set a valid SQL Server connection string in .env"
  );
}

// mssql/tedious doesn't automatically parse connection strings like pg does
// we need to parse it or use an object
let config;
try {
  const url = new URL(connectionString);
  
  config = {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    server: url.hostname,
    database: url.pathname.replace("/", ""),
    port: url.port ? parseInt(url.port, 10) : 1433,
    options: {
      encrypt: url.searchParams.get("encrypt") === "true",
      trustServerCertificate: false, 
    },
  };
} catch (error) {
  console.error("Failed to parse DATABASE_URL. Is it a valid URL format?");
  throw error;
}

// Global pool promise to reuse the connection
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
