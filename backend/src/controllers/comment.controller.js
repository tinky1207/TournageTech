// backend/src/controllers/comment.controller.js
import asyncHandler from "express-async-handler";
import { pool } from "../config/db.js";

export const createComment = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  const { postId } = req.params;
  const { content, parentId } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const { rows: [user] } = await pool.query(
    `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
    [userId]
  );
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let query = `INSERT INTO comments (user_id, post_id, content`;
  let values = [user.id, postId, content];
  let placeholders = `$1, $2, $3`;
  let paramIndex = 4;

  if (parentId) {
    query += `, parent_id`;
    placeholders += `, $${paramIndex++}`;
    values.push(parentId);
  }

  query += `) VALUES (${placeholders}) RETURNING *`;
  const { rows: [comment] } = await pool.query(query, values);

  // Notification logic
  let toUserId;
  let type;
  if (parentId) {
    const { rows: [parentComment] } = await pool.query(
      `SELECT user_id FROM comments WHERE id = $1`,
      [parentId]
    );
    toUserId = parentComment.user_id;
    type = 'reply';
  } else {
    const { rows: [post] } = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [postId]
    );
    toUserId = post.user_id;
    type = 'comment';
  }

  if (toUserId !== user.id) {
    await pool.query(
      `INSERT INTO notifications (from_id, to_id, type, post_id, comment_id) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, toUserId, type, postId, comment.id]
    );
  }

  res.status(201).json(comment);
});

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userClerkId = req.auth()?.userId ?? null; // Fixed deprecation

  let userIntId = null;
  if (userClerkId) {
    const { rows: [user] } = await pool.query(
      `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
      [userClerkId]
    );
    userIntId = user ? user.id : null;
  }

  const query = `
    SELECT c.*, u.username, u.profile_image_url,
      (SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = c.id) AS like_count,
      ${userIntId ? `EXISTS(SELECT 1 FROM comment_likes l WHERE l.comment_id = c.id AND l.user_id = $2)` : 'FALSE'} AS is_liked
    FROM comments c
    JOIN usersdata u ON c.user_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC
  `;
  const params = userIntId ? [postId, userIntId] : [postId];

  const { rows } = await pool.query(query, params);
  res.status(200).json(rows);
});

export const updateComment = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const { rows: [user] } = await pool.query(
    `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
    [userId]
  );
  if (!user) return res.status(404).json({ error: "User not found" });

  const { rows: [comment] } = await pool.query(
    `SELECT user_id FROM comments WHERE id = $1`,
    [commentId]
  );
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (comment.user_id !== user.id) {
    return res.status(403).json({ error: "You can only edit your own comments" });
  }

  const { rows: [updatedComment] } = await pool.query(
    `UPDATE comments SET content = $1 WHERE id = $2 RETURNING *`,
    [content, commentId]
  );

  res.status(200).json(updatedComment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  const commentId = parseInt(req.params.commentId, 10);
  if (isNaN(commentId)) {
    return res.status(400).json({ error: "Invalid comment ID" });
  }

  const { rows: [user] } = await pool.query(
    `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
    [userId]
  );
  if (!user) return res.status(404).json({ error: "User not found" });

  const { rows: [comment] } = await pool.query(
    `SELECT * FROM comments WHERE id = $1`,
    [commentId]
  );
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.user_id !== user.id) return res.status(403).json({ error: "Unauthorized" });

  // Delete the comment and all descendants in one query
  await pool.query(`
    DELETE FROM comments WHERE id IN (
      WITH RECURSIVE descendants (id) AS (
        SELECT $1::integer
        UNION ALL
        SELECT c.id FROM comments c
        JOIN descendants d ON c.parent_id = d.id
      )
      SELECT id FROM descendants
    )
  `, [commentId]);

  // Optionally clean up related data (likes, notifications) if not handled by CASCADE
  await pool.query(`DELETE FROM comment_likes WHERE comment_id = $1`, [commentId]);
  await pool.query(`DELETE FROM notifications WHERE comment_id = $1`, [commentId]);

  res.status(200).json({ message: "Comment deleted successfully" });
});

export const likeComment = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  const { commentId } = req.params;

  const { rows: [user] } = await pool.query(
    `SELECT id FROM usersdata WHERE clerk_user_id = $1`,
    [userId]
  );
  if (!user) return res.status(404).json({ error: "User not found" });

  const { rows: [comment] } = await pool.query(
    `SELECT user_id FROM comments WHERE id = $1`,
    [commentId]
  );
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const { rows: [existingLike] } = await pool.query(
    `SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
    [commentId, user.id]
  );

  const isLiked = !!existingLike;

  if (isLiked) {
    await pool.query(
      `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, user.id]
    );
  } else {
    await pool.query(
      `INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)`,
      [commentId, user.id]
    );
    if (comment.user_id !== user.id) {
      await pool.query(
        `INSERT INTO notifications (from_id, to_id, type, comment_id) VALUES ($1, $2, 'comment_like', $3)`,
        [user.id, comment.user_id, commentId]
      );
    }
  }

  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1`,
    [commentId]
  );
  const updatedLikeCount = parseInt(count, 10);

  res.status(200).json({
    message: isLiked ? "Comment unliked" : "Comment liked",
    likes: updatedLikeCount,
  });
});