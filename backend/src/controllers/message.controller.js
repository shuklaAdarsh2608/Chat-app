import Message from "../models/message.models.js";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.models.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.body.receiverId || req.params.id;
    const { text } = req.body;
    let imageUrl = null;

    // Handle image upload if present
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_images",
      });
      imageUrl = uploaded.secure_url;
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      text: text || "",
      image: imageUrl || "",
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } });
    res.json(users);
  } catch (error) {
    console.error("Sidebar users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
