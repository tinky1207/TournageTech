// backend/src/controllers/post.controller.js
import asyncHandler from "express-async-handler";
import { pool } from "../config/db.js";
import imagekit from "../config/imagekit.js";
import { Clerk } from "@clerk/clerk-sdk-node";

const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export const createPost = asyncHandler(async (req, res) => {
  const { userId } = req.auth();  // Use function call to address deprecation

  // Fetch user from Clerk to check username
  const clerkUser = await clerk.users.getUser(userId);
  console.log('Fetched Clerk user:', clerkUser);
  console.log('User username:', clerkUser.username);

  if (clerkUser.username !== "tournagetech") {
    console.log('Username mismatch: ', clerkUser.username);
    return res.status(403).json({ error: "Only the author can create posts" });
  }

  const { title, content, category } = req.body;
  if (!title || !content || !category || !["tournament", "on_court", "equipment"].includes(category)) {
    return res.status(400).json({ error: "Invalid post data" });
  }

  // Get the integer user_id from usersdata
  const { rows: [user] } = await pool.query(
    `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
    [userId]
  );
  if (!user) {
    return res.status(404).json({ error: "User not found in database" });
  }

  // Insert post first (without images)
  const { rows: [post] } = await pool.query(
    `INSERT INTO posts (title, content, category, user_id, image_urls) VALUES ($1, $2, $3, $4, '[]') RETURNING *`,
    [title, content, category, user.id]
  );

  // Upload images to ImageKit and insert into post_images
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadResult = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `post-${Date.now()}-${file.originalname}`,
        folder: "/posts",
      });
      // Insert into post_images
      await pool.query(
        `INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`,
        [post.id, uploadResult.url]
      );
    }
  }

  res.status(201).json(post);
});

export const getPosts = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userId = req.auth?.userId; // Optional, from Clerk
  let userIntId = null;
  if (userId) {
    const { rows: [user] } = await pool.query(
      `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
      [userId]
    );
    if (user) userIntId = user.id;
  }

  let params = [];
  let query = `
    SELECT p.*, u.username, u.profile_image_url,
      (SELECT json_agg(pi.image_url) FROM post_images pi WHERE pi.post_id = p.id) as image_urls,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
      ${userIntId ? `EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $${params.length + 1})` : 'FALSE'} as is_liked
    FROM posts p 
    JOIN usersdata u ON p.user_id = u.id 
  `;
  if (userIntId) params.push(userIntId);

  if (category) {
    query += `WHERE p.category = $${params.length + 1} `;
    params.push(category);
  }
  query += `ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const { rows } = await pool.query(query, params);
  res.status(200).json(rows);
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userId = req.auth?.userId; // Optional, from Clerk
  let userIntId = null;
  if (userId) {
    const { rows: [user] } = await pool.query(
      `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
      [userId]
    );
    if (user) userIntId = user.id;
  }

  let params = [username];
  let query = `
    SELECT 
      p.*,
      u.clerk_user_id as user_id, u.username, u.profile_image_url,
      (SELECT json_agg(pi.image_url) FROM post_images pi WHERE pi.post_id = p.id) as image_urls,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
      ${userIntId ? `EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $${params.length + 1})` : 'FALSE'} as is_liked
    FROM posts p
    JOIN usersdata u ON p.user_id = u.id
    WHERE u.username = $1
    ORDER BY p.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  if (userIntId) params.push(userIntId);
  params.push(limit, offset);

  const { rows: posts } = await pool.query(query, params);
  res.status(200).json({ posts });
});

export const likePost = asyncHandler(async (req, res) => {
  const { userId } = req.auth();  // Use function call
  const { postId } = req.params;

  const { rows: [user] } = await pool.query(`
    SELECT id FROM usersdata WHERE clerk_user_id = $1
  `, [userId]);

  const { rows: [post] } = await pool.query(`
    SELECT user_id FROM posts WHERE id = $1
  `, [postId]);

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  const { rows: [existingLike] } = await pool.query(`
    SELECT * FROM likes WHERE post_id = $1 AND user_id = $2
  `, [postId, user.id]);

  const isLiked = !!existingLike;

  if (isLiked) {
    await pool.query(`
      DELETE FROM likes WHERE post_id = $1 AND user_id = $2
    `, [postId, user.id]);
  } else {
    await pool.query(`
      INSERT INTO likes (post_id, user_id) VALUES ($1, $2)
    `, [postId, user.id]);
    if (post.user_id !== user.id) {  // Compare integer IDs
      await pool.query(`
        INSERT INTO notifications (from_id, to_id, type, post_id) VALUES ($1, $2, 'like', $3)
      `, [user.id, post.user_id, postId]);
    }
  }

  const { rows } = await pool.query(`
    SELECT COUNT(*) FROM likes WHERE post_id = $1
  `, [postId]);
  const updatedLikeCount = parseInt(rows[0].count, 10);

  res.status(200).json({
    message: isLiked ? "Post unliked successfully" : "Post liked successfully",
    likes: updatedLikeCount,
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const { userId } = req.auth();  // Use function call
  const { postId } = req.params;

  const { rows: [post] } = await pool.query(`
    SELECT user_id, image_urls FROM posts WHERE id = $1
  `, [postId]);

  if (!post) return res.status(404).json({ error: "Post not found" });

  // Get the clerk_user_id of the post owner to compare with current userId
  const { rows: [postOwner] } = await pool.query(`
    SELECT clerk_user_id FROM usersdata WHERE id = $1
  `, [post.user_id]);

  if (postOwner.clerk_user_id !== userId) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  // Fetch images from post_images
  const { rows: images } = await pool.query(`
    SELECT image_url FROM post_images WHERE post_id = $1
  `, [postId]);

  // Delete images from ImageKit
  for (const img of images) {
    const imagePath = img.image_url.replace(process.env.IMAGEKIT_URL_ENDPOINT, '');
    try {
      await imagekit.deleteFile(imagePath);
    } catch (deleteError) {
      console.error("ImageKit delete error:", deleteError);
    }
  }

  // Delete related records (post_images will cascade on post delete)
  await pool.query(`DELETE FROM comments WHERE post_id = $1`, [postId]);
  await pool.query(`DELETE FROM likes WHERE post_id = $1`, [postId]);
  await pool.query(`DELETE FROM notifications WHERE post_id = $1`, [postId]);
  await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);

  res.status(200).json({ message: "Post deleted successfully" });
});