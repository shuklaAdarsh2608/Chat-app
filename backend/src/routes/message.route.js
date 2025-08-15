import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";
import upload from "../middleware/upload.middleware.js"; // Multer setup for file upload

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

// Add upload.single("image") to handle image uploads
router.post("/send/:id", protectRoute, upload.single("image"), sendMessage);

export default router;
