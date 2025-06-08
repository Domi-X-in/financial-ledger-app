// server/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const passport = require("passport");

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (user) => {
  // Create the JWT with the correct payload structure
  // Make sure this matches what your passport JWT strategy expects
  return jwt.sign(
    {
      user: {
        id: user.id,
        role: user.role,
      },
    },
    process.env.JWT_SECRET || "dev-secret-key-for-jwt",
    { expiresIn: "1d" }
  );
};

// Google callback
exports.googleCallback = (req, res) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      console.error("Google callback error:", err);
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/login?error=auth_failed`
      );
    }

    const token = generateToken(user);
    console.log("Google callback successful for user:", user.email);
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/login/success?token=${token}`
    );
  })(req, res);
};

// Get current user
exports.getCurrentUser = (req, res) => {
  console.log("getCurrentUser called");
  console.log("User in request:", req.user);

  // Return complete user object with all needed fields
  res.json({
    _id: req.user._id,
    id: req.user._id, // Adding id alias for consistency
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    googleId: req.user.googleId,
    createdAt: req.user.createdAt,
  });
};

// New method: Google login via token (for frontend OAuth flow)
exports.googleLogin = async (req, res) => {
  console.log("Google login controller called");
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

    let payload;
    try {
      // Try to verify as ID token first
      console.log("Attempting to verify as ID token...");
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      console.log("Successfully verified as ID token");
    } catch (idTokenError) {
      console.log(
        "Not an ID token, trying as access token...",
        idTokenError.message
      );

      // If not an ID token, try to get user info using access token
      try {
        const response = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        payload = response.data;
        console.log("Successfully retrieved user info from access token");
      } catch (accessTokenError) {
        console.error(
          "Access token verification also failed:",
          accessTokenError.message
        );
        throw new Error(
          "Failed to verify token - neither ID token nor access token worked"
        );
      }
    }

    console.log("Token payload:", payload);

    const { email, name, picture, sub: googleId } = payload;

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
        avatar: picture,
        googleId,
        password: require("crypto").randomBytes(16).toString("hex"), // random password
      });

      await user.save();
      console.log("New user created with ID:", user.id);
    } else {
      console.log("Existing user found with ID:", user.id);

      // Update googleId if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
        console.log("Updated existing user with Google ID");
      }
    }

    // Generate JWT with the correct structure
    const jwtToken = generateToken(user);

    // Log token details before sending
    const decodedToken = jwt.decode(jwtToken);
    console.log("Generated token payload:", decodedToken);
    console.log("Authentication successful for:", email);

    res.json({
      token: jwtToken,
      user: {
        _id: user.id,
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
};

// Test token endpoint
exports.verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key-for-jwt"
    );
    res.json({
      message: "Token is valid",
      decoded,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });
  } catch (err) {
    res.status(401).json({ message: "Token is invalid", error: err.message });
  }
};

// Test endpoint for debugging
exports.googleTest = (req, res) => {
  console.log("Google test endpoint called");
  console.log("Request body:", req.body);
  console.log("Headers:", req.headers);
  res.json({
    message: "Google test endpoint working",
    timestamp: new Date().toISOString(),
    receivedData: req.body,
    clientId: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 8)}...`
      : "Not configured",
  });
};
