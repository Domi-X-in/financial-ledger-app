// server/models/Transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  ledger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ledger",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
