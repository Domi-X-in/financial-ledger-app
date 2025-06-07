// client/src/utils/helpers.js
// Format date to DD-MMM-YY
export const formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(d);
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

// Format currency based on type (USD or BTC)
export const formatCurrency = (amount, currency = "USD") => {
  if (currency === "BTC") {
    return amount.toFixed(8) + " BTC";
  } else {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
};

// Calculate running balance for transactions
export const calculateRunningBalance = (transactions) => {
  let balance = 0;
  return transactions.map((transaction) => {
    balance += transaction.amount;
    return {
      ...transaction,
      balance,
    };
  });
};

// Extract color from logo for styling
export const extractColors = (logoElement) => {
  // This is a placeholder function
  // In a real implementation, we would use canvas to extract colors from the logo
  return {
    primary: "#FF0000",
    secondary: "#FFFFFF",
    text: "#333333",
  };
};
