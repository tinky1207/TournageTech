// backend/src/config/setup.js (Updated to include parent_id in comments and about in usersdata)
import { pool } from './db.js';

async function setupDatabase() {
  try {
    // Existing tables...
    await pool.query(`
      ALTER TABLE usersdata ADD COLUMN IF NOT EXISTS about TEXT;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES usersdata(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);`);
    console.log('Database setup complete.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    pool.end();
  }
}

setupDatabase();