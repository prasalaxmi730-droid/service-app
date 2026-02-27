import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("API running ✅");
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log("Server started"));
