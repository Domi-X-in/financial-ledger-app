// server/controllers/messageController.js
const Message = require("../models/Message");
const User = require("../models/User");

// Send message to admin
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    // For development, use a hardcoded sender ID if not provided
    const sender = req.body.sender || "67d1d05038a4a5d52b50da69"; // Admin user ID from your DB

    console.log("Creating message with:", { sender, content });

    const newMessage = new Message({
      sender,
      content,
    });

    await newMessage.save();
    console.log("Message saved successfully");
    res.json(newMessage);
  } catch (err) {
    console.error("Error in sendMessage:", err.message, err.stack);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all messages (admin only)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark message as read (admin only)
exports.markAsRead = async (req, res) => {
  try {
    let message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete message (admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.deleteOne({ _id: req.params.id });
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
