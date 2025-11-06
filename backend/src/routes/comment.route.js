// backend/src/routes/comment.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createComment, getComments, likeComment, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = express.Router();

router.get("/:postId", getComments);
router.post("/:postId", protectRoute, createComment);
router.put("/:commentId", protectRoute, updateComment);
router.delete("/:commentId", protectRoute, deleteComment);
router.post("/:commentId/like", protectRoute, likeComment);

export default router;