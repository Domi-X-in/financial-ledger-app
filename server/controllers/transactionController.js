// server/controllers/transactionController.js
const Transaction = require("../models/Transaction");
const Ledger = require("../models/Ledger");
const { Parser } = require("json2csv");
const fs = require("fs");
const csv = require("csv-parser");

// Get transactions for a ledger
exports.getLedgerTransactions = async (req, res) => {
  try {
    const ledgerId = req.params.ledgerId;

    // Verify ledger exists and user has access
    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Check if user is owner or admin
    if (ledger.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const transactions = await Transaction.find({ ledger: ledgerId }).sort({
      date: 1,
    });

    // Calculate running balance
    let balance = 0;
    const transactionsWithBalance = transactions.map((transaction) => {
      balance += transaction.amount;
      return {
        ...transaction._doc,
        balance,
      };
    });

    res.json(transactionsWithBalance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create transaction (admin only)
exports.createTransaction = async (req, res) => {
  try {
    const { ledgerId, date, description, amount } = req.body;

    // Verify ledger exists
    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    const newTransaction = new Transaction({
      ledger: ledgerId,
      date: new Date(date),
      description,
      amount,
      createdBy: req.user.id,
    });

    await newTransaction.save();
    res.json(newTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update transaction (admin only)
exports.updateTransaction = async (req, res) => {
  try {
    const { date, description, amount } = req.body;

    let transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Update fields
    if (date) transaction.date = new Date(date);
    if (description) transaction.description = description;
    if (amount !== undefined) transaction.amount = amount;

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete transaction (admin only)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await Transaction.deleteOne({ _id: req.params.id });
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Generate CSV template
exports.generateCSVTemplate = async (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      { date: "YYYY-MM-DD", description: "Sample transaction", amount: 0 },
    ];

    // Define fields
    const fields = ["date", "description", "amount"];

    // Create parser
    const parser = new Parser({ fields });

    // Parse data to CSV
    const csv = parser.parse(sampleData);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transaction_template.csv"'
    );

    // Send CSV
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Import transactions from CSV (admin only)
exports.importTransactionsFromCSV = async (req, res) => {
  try {
    const { ledgerId, transactions } = req.body;

    // Verify ledger exists
    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Validate transactions
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: "Invalid transactions data" });
    }

    const errors = [];
    const validTransactions = [];

    // Validate each transaction
    transactions.forEach((transaction, index) => {
      const { date, description, amount } = transaction;

      // Check required fields
      if (!date || !description || amount === undefined) {
        errors.push(`Row ${index + 1}: Missing required fields`);
        return;
      }

      // Validate date format
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push(`Row ${index + 1}: Invalid date format`);
        return;
      }

      // Validate amount is a number
      if (isNaN(parseFloat(amount))) {
        errors.push(`Row ${index + 1}: Amount must be a number`);
        return;
      }

      // Add valid transaction
      validTransactions.push({
        ledger: ledgerId,
        date: dateObj,
        description,
        amount: parseFloat(amount),
        createdBy: req.user.id,
      });
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation errors",
        errors,
      });
    }

    // Create transactions in database
    const createdTransactions = await Transaction.insertMany(validTransactions);

    res.status(201).json({
      message: `Successfully imported ${createdTransactions.length} transactions`,
      count: createdTransactions.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Import transactions directly from uploaded CSV file
exports.importTransactionsFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { ledgerId } = req.body;

    // Verify ledger exists
    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Ledger not found" });
    }

    const results = [];
    const errors = [];
    let rowIndex = 0;

    // Create a promise to handle the CSV parsing
    const parseCSV = new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
          rowIndex++;
          const { date, description, amount } = data;

          // Check required fields
          if (!date || !description || amount === undefined) {
            errors.push(`Row ${rowIndex}: Missing required fields`);
            return;
          }

          // Validate date format
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            errors.push(`Row ${rowIndex}: Invalid date format`);
            return;
          }

          // Validate amount is a number
          if (isNaN(parseFloat(amount))) {
            errors.push(`Row ${rowIndex}: Amount must be a number`);
            return;
          }

          // Add valid transaction
          results.push({
            ledger: ledgerId,
            date: dateObj,
            description,
            amount: parseFloat(amount),
            createdBy: req.user.id,
          });
        })
        .on("end", () => {
          resolve();
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    // Wait for CSV parsing to complete
    await parseCSV;

    // Delete the uploaded file
    fs.unlinkSync(req.file.path);

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation errors",
        errors,
      });
    }

    // If no valid transactions found
    if (results.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid transactions found in CSV" });
    }

    // Create transactions in database
    const createdTransactions = await Transaction.insertMany(results);

    res.status(201).json({
      message: `Successfully imported ${createdTransactions.length} transactions`,
      count: createdTransactions.length,
    });
  } catch (err) {
    console.error(err);

    // Delete the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: "Server error" });
  }
};
