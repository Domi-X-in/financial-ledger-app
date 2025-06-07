// server/models/Ledger.js
const mongoose = require("mongoose");

const LedgerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    default: "USD",
  },
  description: {
    type: String,
  },
  // New field for managing permissions
  permissions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["viewer", "editor", "admin"],
        default: "viewer",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Ledger", LedgerSchema);
