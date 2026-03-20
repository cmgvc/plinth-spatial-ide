import "dotenv/config"; 
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { rateLimit } from "express-rate-limit"; 
import nodeRoutes from "./routes/nodeRoutes";
import flyRoutes from "./routes/flyRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1); 
const PORT = process.env.PORT || 5001;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const spawnLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  limit: 50, 
  message: { error: "Spawn limit reached. Try again later." },
});

app.use(cors({
  origin: ["https://cmgvc.github.io", "http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.use(express.json());
app.use(generalLimiter);

app.use("/api/fly", spawnLimiter, flyRoutes); 
app.use("/api/nodes", nodeRoutes);
app.use("/api/users", userRoutes);

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err.message));

app.get("/health", (req, res) => res.status(200).send("OK"));

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server active on port ${PORT}`);
});