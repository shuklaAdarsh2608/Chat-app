import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendMessage, getMessages } from "../controllers/message.controller.js";

const router = express.Router();

// Get all messages between two users
router.get("/:id", protectRoute, getMessages);

// Send a message (text and/or image)
router.post("/send/:id", protectRoute, sendMessage);

export default router;
