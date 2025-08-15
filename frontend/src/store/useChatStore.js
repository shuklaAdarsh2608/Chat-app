import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Fetch all chat users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send message (text or image)
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const socket = useAuthStore.getState().socket;

    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    try {
      const isFormData = messageData instanceof FormData;
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
        isFormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : {}
      );

      const savedMessage = res.data;

      // Ensure correct field names
      const formattedMessage = {
        _id: savedMessage._id,
        text: savedMessage.text || "",
        imageUrl: savedMessage.imageUrl || "",
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        createdAt: savedMessage.createdAt
      };

      // Update UI instantly
      set({ messages: [...messages, formattedMessage] });

      // Emit to receiver
      socket.emit("sendMessage", {
        ...formattedMessage,
        receiverId: selectedUser._id,
      });

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Listen for incoming messages
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();

      const senderId = newMessage.senderId?._id || newMessage.senderId;
      const receiverId = newMessage.receiverId?._id || newMessage.receiverId;

      const isRelevant =
        senderId === selectedUser._id || receiverId === selectedUser._id;

      if (!isRelevant) return;

      const alreadyExists = messages.some((m) => m._id === newMessage._id);
      if (alreadyExists) return;

      set({ messages: [...messages, newMessage] });
    });
  },

  // Stop listening
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Select user to chat with
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
