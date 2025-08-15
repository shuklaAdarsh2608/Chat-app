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

  // Fetch chat users
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

  // Fetch messages for selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // Normalize message structure for UI
      const normalized = (res.data || []).map(msg => ({
        _id: msg._id,
        text: msg.text || msg.message || "",
        image: msg.image ? (
          msg.image.startsWith("http")
            ? msg.image
            : `${import.meta.env.VITE_API_BASE_URL}/${msg.image}`
        ) : null,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        createdAt: msg.createdAt
      }));
      set({ messages: normalized });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const socket = useAuthStore.getState().socket;

    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const savedMessage = res.data;
      const normalized = {
        _id: savedMessage._id,
        text: savedMessage.text || savedMessage.message || "",
        image: savedMessage.image ? (
          savedMessage.image.startsWith("http")
            ? savedMessage.image
            : `${import.meta.env.VITE_API_BASE_URL}/${savedMessage.image}`
        ) : null,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        createdAt: savedMessage.createdAt
      };

      set({ messages: [...messages, normalized] });

      socket.emit("sendMessage", {
        ...normalized,
        receiverId: selectedUser._id
      });

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Listen for incoming messages
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      const isRelevant =
        newMessage.senderId === selectedUser?._id ||
        newMessage.receiverId === selectedUser?._id;

      if (!isRelevant) return;

      const normalized = {
        _id: newMessage._id,
        text: newMessage.text || newMessage.message || "",
        image: newMessage.image ? (
          newMessage.image.startsWith("http")
            ? newMessage.image
            : `${import.meta.env.VITE_API_BASE_URL}/${newMessage.image}`
        ) : null,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        createdAt: newMessage.createdAt
      };

      if (!messages.some((m) => m._id === normalized._id)) {
        set({ messages: [...messages, normalized] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
