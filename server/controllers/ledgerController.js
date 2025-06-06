// server/controllers/ledgerController.js
const Ledger = require("../models/Ledger");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const emailService = require("../utils/emailService");
const mongoose = require("mongoose");

// Get all ledgers for current user
exports.getUserLedgers = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Processing request for user ID: ${userId}`);

    // For admin users, we can return all ledgers
    if (req.user.role === "admin") {
      const ledgers = await Ledger.find().populate("owner", "name email");
      console.log(`Admin user - found ${ledgers.length} ledgers`);
      return res.json(ledgers);
    }

    // For regular users, return ledgers where they are the owner OR they have permission
    // Convert userId to string to ensure proper comparison with MongoDB ObjectIds
    const userIdStr = userId.toString();

    const ledgers = await Ledger.find({
      $or: [
        { owner: userId },
        { "permissions.user": userId }, // Direct comparison with userId object
      ],
    }).populate("owner", "name email");

    console.log(
      `User ${req.user.email} (ID: ${userIdStr}) - found ${ledgers.length} ledgers they have access to`
    );

    // If no ledgers found, log more details for debugging
    if (ledgers.length === 0) {
      console.log(
        `No ledgers found for user ${req.user.email} (ID: ${userIdStr})`
      );

      // Additional check to see if permissions exist at all
      const allLedgers = await Ledger.find({
        "permissions.user": { $exists: true },
      });

      console.log(`Found ${allLedgers.length} ledgers with any permissions`);

      // Check each ledger's permissions more explicitly
      for (const ledger of allLedgers) {
        if (ledger.permissions && ledger.permissions.length > 0) {
          console.log(
            `Ledger ${ledger.name} has ${ledger.permissions.length} permission entries`
          );
          ledger.permissions.forEach((perm) => {
            console.log(
              `Permission entry: user=${perm.user.toString()}, role=${
                perm.role
              }`
            );
          });
        }
      }
    }

    res.json(ledgers);
  } catch (err) {
    console.error("Error in getUserLedgers:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get ledger by ID with transactions
exports.getLedgerById = async (req, res) => {
  try {
    const userId = req.user._id;
    const ledger = await Ledger.findById(req.params.id);

    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Check if user is owner, has permission, or is admin
    const isOwner = ledger.owner.toString() === userId.toString();
    const hasPermission =
      ledger.permissions &&
      ledger.permissions.some((p) => p.user.toString() === userId.toString());
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !hasPermission && !isAdmin) {
      console.log(
        `Access denied: User ${userId} attempted to access ledger ${ledger._id}`
      );
      return res.status(403).json({ message: "Access denied" });
    }

    // Get transactions for this ledger
    const transactions = await Transaction.find({ ledger: req.params.id }).sort(
      { date: 1 }
    );

    // Calculate running balance
    let balance = 0;
    const transactionsWithBalance = transactions.map((transaction) => {
      balance += transaction.amount;
      return {
        ...transaction._doc,
        balance,
      };
    });

    res.json({
      ledger,
      transactions: transactionsWithBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new ledger (admin only)
exports.createLedger = async (req, res) => {
  try {
    const { name, ownerId, currency, description, permissions = [] } = req.body;

    // Validate owner
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    // Process permissions
    const processedPermissions = [];
    if (Array.isArray(permissions)) {
      for (const perm of permissions) {
        // Validate user exists
        const user = await User.findById(perm.user);
        if (user) {
          processedPermissions.push({
            user: perm.user,
            role: perm.role || "viewer",
            addedBy: req.user._id,
            addedAt: new Date(),
          });
        }
      }
    }

    const newLedger = new Ledger({
      name,
      owner: ownerId,
      currency: currency || "USD",
      description,
      permissions: processedPermissions,
      createdBy: req.user._id,
    });

    await newLedger.save();

    // Notify owner if they're different from creator
    if (ownerId !== req.user._id) {
      emailService.sendLedgerCreationNotification(owner.email, name);
    }

    res.json(newLedger);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update ledger (admin only)
exports.updateLedger = async (req, res) => {
  try {
    const { name, ownerId, currency, description, permissions } = req.body;

    let ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Update basic fields
    if (name) ledger.name = name;
    if (ownerId) {
      const owner = await User.findById(ownerId);
      if (!owner) {
        return res.status(400).json({ message: "Invalid owner ID" });
      }
      ledger.owner = ownerId;
    }
    if (currency) ledger.currency = currency;
    if (description !== undefined) ledger.description = description;

    // Update permissions
    if (permissions && Array.isArray(permissions)) {
      // Process permissions
      const processedPermissions = [];
      for (const perm of permissions) {
        // Validate user exists
        const user = await User.findById(perm.user);
        if (user) {
          processedPermissions.push({
            user: perm.user,
            role: perm.role || "viewer",
            addedBy: req.user._id,
            addedAt: new Date(),
          });
        }
      }
      ledger.permissions = processedPermissions;
    }

    await ledger.save();
    res.json(ledger);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update ledger permissions
exports.updateLedgerPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    let ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Only owner or admin can update permissions
    if (
      ledger.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only the owner or admin can update permissions" });
    }

    // Update permissions
    if (permissions && Array.isArray(permissions)) {
      // Process permissions
      const processedPermissions = [];
      for (const perm of permissions) {
        // Validate user exists
        const user = await User.findById(perm.user);
        if (user) {
          processedPermissions.push({
            user: perm.user,
            role: perm.role || "viewer",
            addedBy: req.user._id,
            addedAt: new Date(),
          });
        }
      }
      ledger.permissions = processedPermissions;
      await ledger.save();

      res.json({ message: "Permissions updated successfully", ledger });
    } else {
      return res.status(400).json({ message: "Invalid permissions format" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete ledger (admin only)
exports.deleteLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Delete associated transactions
    await Transaction.deleteMany({ ledger: req.params.id });

    // Delete ledger
    await Ledger.deleteOne({ _id: req.params.id });

    res.json({ message: "Ledger deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
