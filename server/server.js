// server/server.js
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const ledgerRoutes = require("./routes/ledgers");
const transactionRoutes = require("./routes/transactions");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5003;

// Connect to MongoDB
require("./config/db");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
require("./config/passport")(passport);

// Add Cross-Origin-Opener-Policy header for Google OAuth
app.use((req, res, next) => {
  res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ledgers", ledgerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
