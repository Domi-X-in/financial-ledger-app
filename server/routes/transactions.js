// server/routes/transactions.js
const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");

// Get all transactions for a ledger
router.get(
  "/ledger/:ledgerId",
  auth,
  transactionController.getLedgerTransactions
);

// Create transaction (admin only)
router.post("/", [auth, admin], transactionController.createTransaction);

// Update transaction (admin only)
router.put("/:id", [auth, admin], transactionController.updateTransaction);

// Delete transaction (admin only)
router.delete("/:id", [auth, admin], transactionController.deleteTransaction);

// Generate CSV template
router.get("/template/csv", auth, transactionController.generateCSVTemplate);

// Import transactions from CSV (admin only)
router.post(
  "/import/csv",
  [auth, admin],
  transactionController.importTransactionsFromCSV
);

// Import transactions from CSV file upload (admin only)
router.post(
  "/import/file",
  [auth, admin, upload.single("csvFile")],
  transactionController.importTransactionsFromFile
);

module.exports = router;
