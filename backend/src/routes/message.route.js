import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

// Get all users except current logged-in user (sidebar list)
router.get("/users", protectRoute, getUsersForSidebar);

// Get chat history between current user and another user
router.get("/:id", protectRoute, getMessages);

// Send a new message (text + optional image)
router.post("/send/:id", protectRoute, sendMessage);

export default router;
