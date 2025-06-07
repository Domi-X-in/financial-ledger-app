// server/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use MONGODB_URI from environment or fall back to local MongoDB
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ledgerApp";

    // Connect without deprecated options
    await mongoose.connect(uri);
    console.log("✔️  MongoDB connected...");
  } catch (err) {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

module.exports = mongoose;
