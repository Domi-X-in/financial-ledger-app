// server/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const axios = require("axios");
const authController = require("../controllers/authController");
const passport = require("passport");

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.get("/verify-token", authController.verifyToken);

// Debug endpoint to check tokens
router.get("/token-debug", (req, res) => {
  const authHeader = req.headers.authorization;
  console.log(
    "Auth header:",
    authHeader ? `${authHeader.substring(0, 20)}...` : "None"
  );

  try {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev-secret-key-for-jwt"
      );
      console.log("Decoded token:", decoded);
      res.json({ message: "Token valid", decoded });
    } else {
      res.status(401).json({ message: "No token provided" });
    }
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ message: "Token invalid", error: err.message });
  }
});

// Test endpoint to verify API connectivity
router.post("/google-test", (req, res) => {
  console.log("Google test endpoint called");
  console.log("Request body:", req.body);
  console.log("Headers:", req.headers);
  res.json({
    message: "Google test endpoint working",
    timestamp: new Date().toISOString(),
    receivedData: req.body,
  });
});

// Google authentication route for access tokens (from @react-oauth/google)
router.post("/google", async (req, res) => {
  console.log("Google access token endpoint hit");
  try {
    const { token } = req.body;
    console.log(
      "Received token (first 20 chars):",
      token?.substring(0, 20) + "..."
    );

    if (!token) {
      console.log("No token provided in request");
      return res.status(400).json({ message: "No token provided" });
    }

    // Get user info using the access token
    let userInfo;
    try {
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      userInfo = response.data;
      console.log("Successfully retrieved user info from access token");
    } catch (error) {
      console.error("Failed to verify access token:", error.message);
      return res.status(401).json({
        message: "Invalid access token",
        error: error.message,
      });
    }

    //console.log("User info from Google:", userInfo);

    const { email, name, picture, sub: googleId } = userInfo;

    if (!email) {
      console.log("Email not provided in Google response");
      return res
        .status(400)
        .json({ message: "Email not provided in Google response" });
    }

    // Check if user exists in database
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      console.log("Creating new user for:", email);
      user = new User({
        name,
        email,
        googleId, // Store Google's user ID
        profilePicture: picture,
        password: crypto.randomBytes(16).toString("hex"), // random password
      });

      await user.save();
      console.log("New user created with ID:", user.id);
    } else {
      // Update googleId if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        // Optionally update profile picture
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
        console.log("Updated existing user with Google ID:", user.id);
      }
    }

    // Generate JWT
    const jwtPayload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Log the payload structure
    console.log("Creating JWT with payload:", jwtPayload);

    const jwtToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || "dev-secret-key-for-jwt",
      {
        expiresIn: "1d",
      }
    );

    console.log("Authentication successful for:", email);
    console.log(
      "JWT token created (first 20 chars):",
      jwtToken.substring(0, 20) + "..."
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Google auth error details:", err);
    res.status(500).json({
      message: "Google authentication failed",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

// Add a simple login endpoint for testing
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "dev-secret-key-for-jwt",
      { expiresIn: "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add development login endpoint
if (process.env.NODE_ENV === "development") {
  router.post("/dev-login", (req, res) => {
    try {
      const payload = {
        user: {
          id: "dev-user-id",
          role: "admin",
        },
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "dev-secret-key-for-jwt",
        { expiresIn: "1d" }
      );

      res.json({
        token,
        user: {
          id: "dev-user-id",
          name: "Development User",
          email: "dev@example.com",
          role: "admin",
        },
      });
    } catch (err) {
      console.error("Dev login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
}

// Original OAuth flow routes
router.get(
  "/google-oauth",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/api/auth/google/callback", authController.googleCallback);

// Add route for checking current user
router.get(
  "/current",
  (req, res, next) => {
    // console.log("Current user route accessed");
    // console.log("Headers:", req.headers);
    // console.log(
    //   "Auth header:",
    //   req.headers.authorization
    //     ? `${req.headers.authorization.substring(0, 20)}...`
    //     : "None"
    // );
    next();
  },
  passport.authenticate("jwt", { session: false }),
  authController.getCurrentUser
);

module.exports = router;
