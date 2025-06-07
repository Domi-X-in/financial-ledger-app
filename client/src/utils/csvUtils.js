// client/src/utils/csvUtils.js

/**
 * Validates a parsed transaction object
 * @param {Object} transaction - The transaction object
 * @param {number} index - Row index (for error messages)
 * @returns {Object} - { isValid, errors }
 */
export const validateTransaction = (transaction, index) => {
  const errors = [];
  const rowNum = index + 1;

  // Check required fields
  if (!transaction.date) {
    errors.push(`Row ${rowNum}: Date is required`);
  }

  if (!transaction.description) {
    errors.push(`Row ${rowNum}: Description is required`);
  }

  if (transaction.amount === undefined || transaction.amount === "") {
    errors.push(`Row ${rowNum}: Amount is required`);
  }

  // Validate date format
  if (transaction.date) {
    const dateObj = new Date(transaction.date);
    if (isNaN(dateObj.getTime())) {
      errors.push(
        `Row ${rowNum}: Invalid date format. Please use YYYY-MM-DD format`
      );
    }
  }

  // Validate amount is a number
  if (transaction.amount !== undefined && transaction.amount !== "") {
    if (isNaN(parseFloat(transaction.amount))) {
      errors.push(`Row ${rowNum}: Amount must be a number`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formats a date object to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateForCSV = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // Returns YYYY-MM-DD
};

/**
 * Creates a sample CSV content for download
 * @returns {string} - CSV content
 */
export const createSampleCSV = () => {
  const headers = ["date", "description", "amount"];
  const rows = [
    ["2025-03-15", "Rent payment", "-1500.00"],
    ["2025-03-16", "Salary deposit", "3000.00"],
    ["2025-03-20", "Grocery shopping", "-125.50"],
  ];

  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += row.join(",") + "\n";
  });

  return csv;
};

/**
 * Downloads existing transactions as CSV
 * @param {Array} transactions - Array of transaction objects
 * @param {string} ledgerName - Name of the ledger (for filename)
 */
export const downloadTransactionsAsCSV = (transactions, ledgerName) => {
  if (!transactions || transactions.length === 0) {
    console.error("No transactions to download");
    return;
  }

  const headers = ["date", "description", "amount"];

  // Create rows from transactions
  const rows = transactions.map((transaction) => [
    formatDateForCSV(transaction.date),
    // Escape commas and quotes in description
    `"${transaction.description.replace(/"/g, '""')}"`,
    transaction.amount,
  ]);

  // Build CSV content
  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += row.join(",") + "\n";
  });

  // Create download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  // Clean ledger name for filename
  const filename = ledgerName
    ? `${ledgerName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_transactions.csv`
    : "transactions.csv";

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
