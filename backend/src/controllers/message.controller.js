import User from "../models/user.models.js";
import Message from "../models/message.models.js";
import cloudinary from "../lib/cloudinary.js";

// Get all users except logged-in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all messages between logged-in user and selected user
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // sort by time

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Send message (text + optional image)
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body; // image can be base64 string
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = null;

    // Upload image to Cloudinary if exists
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_images",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Save message in DB
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Emit real-time message to receiver
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("newMessage", newMessage);
      io.to(senderId.toString()).emit("newMessage", newMessage); // also emit to sender
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
