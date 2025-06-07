// server/routes/ledgers.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const ledgerController = require("../controllers/ledgerController");

// Get all ledgers for current user
router.get("/", auth, ledgerController.getUserLedgers);

// Get single ledger details
router.get("/:id", auth, ledgerController.getLedgerById);

// Admin routes - require admin middleware
router.post("/", [auth, admin], ledgerController.createLedger);
router.put("/:id", [auth, admin], ledgerController.updateLedger);
router.delete("/:id", [auth, admin], ledgerController.deleteLedger);

// Permissions management route
// Allow either admins or the ledger owner to update permissions
router.put("/:id/permissions", auth, ledgerController.updateLedgerPermissions);

module.exports = router;
