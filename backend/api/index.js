// backend/api/index.js
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "../src/routes/user.route.js";
import postRoutes from "../src/routes/post.route.js";
import commentRoutes from "../src/routes/comment.route.js";
import notificationRoutes from "../src/routes/notification.route.js";

import { ENV } from "../src/config/env.js";
import { pool } from "../src/config/db.js";
import { arcjetMiddleware } from "../src/middleware/arcjet.middleware.js";

process.env.CLERK_TELEMETRY_DISABLED = '1';

const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware({
  secretKey: ENV.CLERK_SECRET_KEY
}));

app.use(arcjetMiddleware);

app.get("/", (req, res) => res.send("Hello from server"));

// Mount routes without /api prefix since function is at /api
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/notifications", notificationRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;