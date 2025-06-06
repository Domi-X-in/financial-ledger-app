// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (req, res, next) => {
  // IMPORTANT: We're removing the development mode bypass
  // to ensure permissions are properly enforced

  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No valid authorization header found");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    // Find user in database
    User.findById(decoded.user.id)
      .then((user) => {
        if (!user) {
          console.log(`User not found with ID: ${decoded.user.id}`);
          return res.status(401).json({ message: "User not found" });
        }

        console.log(`User authenticated: ${user.name} (${user.email})`);
        req.user = user;
        next();
      })
      .catch((err) => {
        console.error("Database error when finding user:", err);
        res.status(500).json({ message: "Server error" });
      });
  } catch (err) {
    console.error("Token verification error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};
