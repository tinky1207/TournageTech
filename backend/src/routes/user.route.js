// backend/src/routes/user.route.js (Updated)
import express from "express";
import {
  getUserProfile,
  updateProfile,
  getUserComments,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// public route
router.get("/profile/:username", getUserProfile);

// protected routes
router.put("/profile", protectRoute, updateProfile);
router.get("/comments", protectRoute, getUserComments);

export default router;