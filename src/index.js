import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("API running ✅");
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log("Server started"));

pool.connect()
	.then(() => console.log("DB connected ✅"))
	.catch(err => console.log(err));
