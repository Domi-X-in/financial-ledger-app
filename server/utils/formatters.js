// server/utils/formatters.js
// Format date to DD-MMM-YY
exports.formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(d);
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

// Format currency based on type (USD or BTC)
exports.formatCurrency = (amount, currency) => {
  if (currency === "BTC") {
    return amount.toFixed(8) + " BTC";
  } else {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
};
