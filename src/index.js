import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";
import { initDB } from "./config/initDb.js";
import serviceCallRoutes from "./routes/serviceCallRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/service-calls", serviceCallRoutes);

app.get("/", (req, res) => {
	res.send("API running ✅");
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log("Server started"));

pool.connect()
	.then(async () => {
		console.log("DB connected ✅");
		try {
			await initDB();
		} catch (err) {
			console.log(err);
		}
	})
	.catch(err => console.log(err));
