// backend/src/controllers/user.controller.js (Updated for 'about')
import asyncHandler from "express-async-handler";
import { pool } from "../config/db.js";
import imagekit from "../config/imagekit.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { rows: [user] } = await pool.query(`
    SELECT clerk_user_id as clerk_id, username, dob as date_of_birth, level, years, purposes, profile_image_url, about
    FROM usersdata WHERE username = $1
  `, [username]);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.auth;
  const { username, base64Image, mimeType, about } = req.body;
  let profileImageUrl = null;

  if (base64Image && mimeType) {
    try {
      const fileName = `profile-${Date.now()}.${mimeType.split("/")[1]}`;
      const uploadResult = await imagekit.upload({
        file: base64Image,
        fileName,
        folder: "/profiles",
      });
      profileImageUrl = uploadResult.url;
    } catch (uploadError) {
      console.error("ImageKit upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload image" });
    }
  }

  if (username) {
    const { rows: existing } = await pool.query(`
      SELECT 1 FROM usersdata WHERE username = $1 AND clerk_user_id != $2
    `, [username, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }
  }

  const { rows: [user] } = await pool.query(`
    UPDATE usersdata
    SET username = COALESCE($1, username),
        profile_image_url = COALESCE($2, profile_image_url),
        about = COALESCE($3, about)
    WHERE clerk_user_id = $4
    RETURNING *
  `, [username, profileImageUrl, about, userId]);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json({ user });
});

export const getUserComments = asyncHandler(async (req, res) => {
  const { userId } = req.auth;
  const { rows: [user] } = await pool.query(`SELECT id FROM usersdata WHERE clerk_user_id = $1`, [userId]);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { rows } = await pool.query(`
    SELECT c.*, p.title as post_title 
    FROM comments c 
    JOIN posts p ON c.post_id = p.id 
    WHERE c.user_id = $1 
    ORDER BY c.created_at DESC
  `, [user.id]);
  res.status(200).json(rows);
});


export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = req.auth;
  const { rows: [user] } = await pool.query(`
    SELECT * FROM usersdata WHERE clerk_user_id = $1
  `, [userId]);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
});