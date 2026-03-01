import app from "./app.js";
import { pool } from "./config/db.js";
import { initDB } from "./config/initDb.js";

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");

    await initDB();
    console.log("Database initialized");

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
