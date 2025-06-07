// server/scripts/add-permissions.js
// Run this script to add permissions field to existing ledgers
require("dotenv").config();
const mongoose = require("mongoose");
const Ledger = require("../models/Ledger");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/ledgerApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for migration..."))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

async function migratePermissions() {
  try {
    // Find all ledgers without permissions field
    const ledgers = await Ledger.find({
      permissions: { $exists: false },
    });

    console.log(`Found ${ledgers.length} ledgers without permissions field`);

    // Add permissions field to each ledger
    for (const ledger of ledgers) {
      ledger.permissions = [];
      await ledger.save();
      console.log(`Updated ledger: ${ledger.name}`);
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migratePermissions();
