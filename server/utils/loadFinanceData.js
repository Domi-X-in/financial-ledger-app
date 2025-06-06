const mongoose = require("mongoose");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

// Import models
const Transaction = require("../models/Transaction");
const Ledger = require("../models/Ledger");

// Function to clear existing transactions
async function clearTransactionData() {
  try {
    console.log("Clearing existing transaction data...");
    const result = await Transaction.deleteMany({});
    console.log(`Deleted ${result.deletedCount} existing transactions`);
  } catch (error) {
    console.error("Error clearing transaction data:", error);
    throw error;
  }
}

// Function to find or create ledgers
async function findOrCreateLedger(ledgerName) {
  let ledger = await Ledger.findOne({ name: ledgerName });

  if (!ledger) {
    console.log(`Creating new ledger: ${ledgerName}`);
    ledger = new Ledger({
      name: ledgerName,
      description: `Ledger for ${ledgerName}`,
      // Add any other required fields for your Ledger model
    });
    await ledger.save();
  }

  return ledger._id;
}

// Main function to load transactions from Excel
async function loadTransactions(filePath) {
  let connection = null;

  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/financial-ledger"
    );
    connection = mongoose.connection;
    console.log("Connected to MongoDB");

    // Clear existing data
    await clearTransactionData();

    // Read the Excel file
    console.log(`Reading Excel file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileData = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileData, {
      type: "buffer",
      cellDates: true,
    });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Skip the header row (first row) and process data
    const dataRows = jsonData.slice(1);
    console.log(`Found ${dataRows.length} transaction records to import`);

    // Column mapping (from Excel to MongoDB schema)
    const columnMapping = {
      __EMPTY_1: "date",
      __EMPTY_2: "user",
      __EMPTY_3: "mailAddress",
      __EMPTY_4: "role",
      __EMPTY_5: "ledgerName", // This will be processed to get ledger ObjectId
      __EMPTY_6: "description",
      __EMPTY_7: "amount",
      __EMPTY_8: "balance",
      __EMPTY_9: "currency",
    };

    // Create a map to store ledger names and their corresponding ObjectIds
    const ledgerMap = new Map();

    // Transform data to match Transaction model schema
    const transactionPromises = dataRows.map(async (row) => {
      const transaction = {};
      let ledgerName = null;

      // Map fields using the column mapping
      Object.entries(row).forEach(([key, value]) => {
        const mappedKey = columnMapping[key];
        if (mappedKey) {
          // Store ledgerName separately, we'll process it to get ledger ObjectId
          if (mappedKey === "ledgerName") {
            ledgerName = value;
          } else {
            transaction[mappedKey] = value;
          }
        }
      });

      // Skip if no ledger name
      if (!ledgerName) {
        return null;
      }

      // Get or create the ledger
      if (!ledgerMap.has(ledgerName)) {
        const ledgerId = await findOrCreateLedger(ledgerName);
        ledgerMap.set(ledgerName, ledgerId);
      }

      // Set the ledger ObjectId reference
      transaction.ledger = ledgerMap.get(ledgerName);

      return transaction;
    });

    // Wait for all ledger lookups to complete
    let transactions = await Promise.all(transactionPromises);

    // Filter out any null transactions (ones with missing required data)
    transactions = transactions.filter((t) => t !== null);

    // Filter out incomplete records
    const validTransactions = transactions.filter(
      (transaction) =>
        transaction.date &&
        transaction.user &&
        transaction.ledger &&
        transaction.amount !== undefined &&
        transaction.currency
    );

    console.log(
      `Importing ${validTransactions.length} valid transactions (${
        transactions.length - validTransactions.length
      } records skipped)`
    );

    // Use insertMany to batch insert all transactions
    if (validTransactions.length > 0) {
      const result = await Transaction.insertMany(validTransactions);
      console.log(`Successfully imported ${result.length} transactions`);
    } else {
      console.log("No valid transactions found to import");
    }

    console.log("Data import completed successfully");
  } catch (error) {
    console.error("Error loading transaction data:", error);
    throw error;
  } finally {
    // Close the connection
    if (connection) {
      await mongoose.connection.close();
      console.log("Database connection closed");
    }
  }
}

// Execute if called directly from command line
if (require.main === module) {
  // Get file path from command line argument, default to relative path if not provided
  const defaultPath = path.join(__dirname, "../../finance.xlsx");
  const filePath = process.argv[2] || defaultPath;

  loadTransactions(filePath)
    .then(() => {
      console.log("Transaction data loading process completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Transaction data loading failed:", err);
      process.exit(1);
    });
}

module.exports = { loadTransactions, clearTransactionData };
