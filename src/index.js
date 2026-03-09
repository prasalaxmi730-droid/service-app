import app from "./app.js";
import { poolPromise } from "./config/db.js";
import { initDB } from "./config/initDb.js";

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    const pool = await poolPromise;
    await pool.request().query("SELECT 1 as is_alive");
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
