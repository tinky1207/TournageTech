// controllers/comment.controller.js
import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import { pool } from "../config/db.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.auth;

  const { rows: [user] } = await pool.query(`
    SELECT id FROM users WHERE clerk_id = $1
  `, [userId]);

  if (!user) return res.status(404).json({ error: "User not found" });

  const { rows: notifications } = await pool.query(`
    SELECT 
      n.id, n.type, n.created_at, n.post_id, n.comment_id,
      f.id as from_id, f.username as from_username, f.first_name as from_first_name, f.last_name as from_last_name, f.profile_picture as from_profile_picture,
      p.content as post_content, p.image as post_image,
      c.content as comment_content
    FROM notifications n
    LEFT JOIN users f ON n.from_id = f.id
    LEFT JOIN posts p ON n.post_id = p.id
    LEFT JOIN comments c ON n.comment_id = c.id
    WHERE n.to_id = $1
    ORDER BY n.created_at DESC
  `, [user.id]);

  // Format to match original
  const formatted = notifications.map(notif => ({
    ...notif,
    from: {
      id: notif.from_id,
      username: notif.from_username,
      firstName: notif.from_first_name,
      lastName: notif.from_last_name,
      profilePicture: notif.from_profile_picture
    },
    post: notif.post_id ? { content: notif.post_content, image: notif.post_image } : undefined,
    comment: notif.comment_id ? { content: notif.comment_content } : undefined
  }));

  res.status(200).json({ notifications: formatted });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { userId } = req.auth;
  const { notificationId } = req.params;

  const { rows: [user] } = await pool.query(`
    SELECT id FROM users WHERE clerk_id = $1
  `, [userId]);

  if (!user) return res.status(404).json({ error: "User not found" });

  const { rowCount } = await pool.query(`
    DELETE FROM notifications
    WHERE id = $1 AND to_id = $2
  `, [notificationId, user.id]);

  if (rowCount === 0) return res.status(404).json({ error: "Notification not found" });

  res.status(200).json({ message: "Notification deleted successfully" });
});