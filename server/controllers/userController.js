// server/controllers/userController.js
const User = require("../models/User");
const emailService = require("../utils/emailService");

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-googleId");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Invite user (admin only)
exports.inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(20).toString("hex");

    // Create temporary user record
    const newUser = new User({
      email,
      role: role || "user",
      name: "Invited User",
      googleId: `temp_${inviteToken}`,
      temp: true,
      inviteToken,
    });

    await newUser.save();

    // Send invitation email
    const inviteUrl = `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/signup?token=${inviteToken}`;
    await emailService.sendInvitation(email, inviteUrl);

    res.json({ message: "Invitation sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne({ _id: req.params.id });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
