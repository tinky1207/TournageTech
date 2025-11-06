// backend/src/config/db.js
import { Pool } from "pg";
import { ENV } from "./env.js";

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Try setting to true if certificate issues persist
  },
});

export const connectDB = async (retries = 5) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const client = await pool.connect();
      console.log("Connected to PostgreSQL DB SUCCESSFULLY ✅");
      client.release();
      return; // Success, exit function
    } catch (error) {
      attempt++;
      console.error(`Error connecting to PostgreSQL (attempt ${attempt}/${retries}):`, error.message);
      if (attempt === retries) {
        console.error("Max retries reached. App will continue but DB operations may fail.");
        // Do not exit process to prevent service crash
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
  }
};

// Export the pool for use in other parts of the application
export { pool };