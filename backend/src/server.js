// backend/src/server.js
import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";
import { clerkMiddleware } from "@clerk/express";

// New imports for the added functionality
import { Pool } from 'pg';
import ImageKit from 'imagekit';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import job from './config/cron.js'

import commentRouter from './routes/comment.route.js';

process.env.CLERK_TELEMETRY_DISABLED = '1';

const app = express();

job.start();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(clerkMiddleware()); // Added to populate req.auth
app.use('/api/comments', commentRouter);
// app.use(arcjetMiddleware); // Temporarily disabled to bypass BOT detection

// New setups (assuming connectDB establishes the PG connection; if pool is exported from db.js, import it instead)
let pool;
(async () => {
  await connectDB(); // Run existing connectDB
  // If connectDB doesn't set pool, initialize here using DATABASE_URL
  pool = new Pool({
    connectionString: ENV.DATABASE_URL,
    connectionTimeoutMillis: 120000, // Increased to 2 minutes for cold starts
    ssl: { rejectUnauthorized: false }, // Bypass cert validation if issues
  });
  try {
    const client = await connectWithRetry(); // Use new retry wrapper
    console.log('Successfully connected to PostgreSQL');
    client.release(); // Release after test
  } catch (err) {
    console.error('PostgreSQL connection error (after retries):', err.message);
    // Optionally, process.exit(1) if you want to fail hard; otherwise, app continues without DB
  }
})();

// Retry function for pool connection
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.connect();
    } catch (err) {
      console.error(`Connection failed (attempt ${attempt}):`, err.message, err.stack);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Exponential backoff
    }
  }
}

// ImageKit setup (add keys to your ENV or replace)
const imagekit = new ImageKit({
  publicKey: ENV.IMAGEKIT_PUBLIC_KEY || 'public_HYyMCOZJWCM6BoxRqyXsiPAt++I=',
  privateKey: ENV.IMAGEKIT_PRIVATE_KEY || 'private_8M9+GFApR+18nqUL4Fhy+Phm1b8=',
  urlEndpoint: ENV.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/TournageTech',
});

// Retry function for PG queries to handle cold starts
async function queryWithRetry(query, params, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Executing query (attempt ${attempt}):`, query, 'with params:', params);
      return await pool.query(query, params);
    } catch (err) {
      console.error(`Query failed (attempt ${attempt}):`, err.message, err.stack);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// Update custom routes to use protectRoute from middleware/auth.middleware.js
import { protectRoute } from "./middleware/auth.middleware.js"; // Ensure imported

// New profile route (POST) - updated to use protectRoute
app.post('/api/users/profile', protectRoute, async (req, res) => {
  console.log('POST /api/users/profile received');
  const { userId } = req.auth; // Use req.auth from clerkMiddleware
  const { username, dob, level, years, purposes, base64Image, mimeType } = req.body;
  console.log('Auth Clerk User ID:', userId); // Additional log for debugging
  try {
    console.log('Received profile data:', { userId, username, dob, level, years, purposes, hasImage: !!base64Image });
    // Check if profile already exists by clerk_user_id
    const existing = await queryWithRetry('SELECT * FROM usersdata WHERE clerk_user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(200).json({ success: true }); // Already exists, success without insert
    }
    // Use default username if not provided
    const finalUsername = username || `user_${userId.substring(5, 10)}`; // Fallback to partial ID
    // Check for existing username in PG with retry
    const usernameCheck = await queryWithRetry('SELECT * FROM usersdata WHERE username = $1', [finalUsername]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    let profileImageUrl = null;
    if (base64Image && mimeType) {
      // Upload to ImageKit
      try {
        const uploadResponse = await imagekit.upload({
          file: base64Image,
          fileName: `${finalUsername}-profile.${mimeType.split('/')[1]}`,
        });
        profileImageUrl = uploadResponse.url;
        console.log('Image uploaded:', profileImageUrl);
      } catch (uploadErr) {
        console.error('ImageKit upload error:', uploadErr.message, uploadErr.stack);
        throw new Error('Failed to upload image: ' + uploadErr.message);
      }
    }
    // Log insert params for debugging
    const insertParams = [userId, finalUsername, new Date(dob), level, parseInt(years, 10) || 0, JSON.stringify(purposes || []), profileImageUrl];
    console.log('Insert params:', insertParams);
    // Save to PG with retry
    await queryWithRetry(
      `INSERT INTO usersdata (clerk_user_id, username, dob, level, years, purposes, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      insertParams
    );
    console.log('Profile saved successfully for user:', userId);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Profile save error:', err.message);
    console.error('Full error stack:', err.stack);
    res.status(500).json({ error: 'Failed to save user: ' + err.message });
  }
});

app.get('/api/users/all', protectRoute, async (req, res) => { // Updated to protectRoute
  try {
    const result = await queryWithRetry('SELECT * FROM usersdata');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
});

app.get('/api/users/profile', protectRoute, async (req, res) => {
  const { userId } = req.auth;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await queryWithRetry('SELECT * FROM usersdata WHERE clerk_user_id = $1', [userId]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
// Test endpoint to check DB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await queryWithRetry('SELECT NOW()');
    res.status(200).json({ time: result.rows[0].now });
  } catch (err) {
    console.error('Test DB error:', err.message);
    res.status(500).json({ error: 'DB test failed: ' + err.message });
  }
});
// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message, err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});
const startServer = async () => {
  try {
    // connectDB already called above, but keep if needed
    // await connectDB();
    // listen for local development
    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};
startServer();
console.log('DATABASE_URL:', ENV.DATABASE_URL);
// export for vercel
export default app;