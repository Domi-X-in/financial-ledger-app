// server/routes/messages.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const messageController = require("../controllers/messageController");

// Send message to admin
router.post("/", auth, messageController.sendMessage);

// Admin routes
router.get("/", [auth, admin], messageController.getAllMessages);
router.put("/:id/read", [auth, admin], messageController.markAsRead);
router.delete("/:id", [auth, admin], messageController.deleteMessage);

module.exports = router;
