// backend/src/routes/post.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPost, deletePost, getPosts, getUserPosts, likePost } from "../controllers/post.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// public routes
router.get("/", getPosts); // Now supports ?category=tournament query param
router.get("/user/:username", getUserPosts);

// protected routes
router.post("/", protectRoute, upload.array("images", 5), createPost);
router.post("/:postId/like", protectRoute, likePost);
router.delete("/:postId", protectRoute, deletePost);

export default router;