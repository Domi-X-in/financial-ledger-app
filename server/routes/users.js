// server/routes/users.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const userController = require("../controllers/userController");

// Admin routes
router.get("/", [auth, admin], userController.getAllUsers);
router.post("/", [auth, admin], userController.inviteUser);
router.put("/:id", [auth, admin], userController.updateUser);
router.delete("/:id", [auth, admin], userController.deleteUser);

module.exports = router;
