// client/src/utils/api.js
import axios from "axios";
import config from "../config";

// Create axios instance with base URL
const api = axios.create({
  baseURL: config.apiUrl
});

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Ensure axios is properly configured
const setupAxiosDefaults = () => {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// Ledger API
export const getLedgers = async () => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.get("/api/ledgers", {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching ledgers:", err);
    throw err;
  }
};

export const getLedgerById = async (id) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.get(`/api/ledgers/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error fetching ledger ${id}:`, err);
    throw err;
  }
};

// Ledger Permissions API
export const updateLedgerPermissions = async (ledgerId, permissionsData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.put(
      `/api/ledgers/${ledgerId}/permissions`,
      permissionsData,
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  } catch (err) {
    console.error(`Error updating permissions for ledger ${ledgerId}:`, err);
    throw err;
  }
};

// Transaction API
export const getLedgerTransactions = async (ledgerId) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.get(`/api/transactions/ledger/${ledgerId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error fetching transactions for ledger ${ledgerId}:`, err);
    throw err;
  }
};

// Get all transactions for all accessible ledgers
export const getAllTransactions = async () => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.get("/api/transactions/all", {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching all transactions:", err);
    throw err;
  }
};

// Download Transaction CSV Template
export const downloadTransactionTemplate = async () => {
  try {
    setupAxiosDefaults(); // Ensure token is set

    // Use axios with responseType blob to handle file download
    const res = await api.get("/api/transactions/template/csv", {
      headers: getAuthHeader(),
      responseType: "blob",
    });

    // Create download link and trigger download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transaction_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (err) {
    console.error("Error downloading CSV template:", err);
    throw err;
  }
};

// Import Transactions from CSV
export const importTransactionsFromCSV = async (ledgerId, transactionsData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.post(
      "/api/transactions/import/csv",
      {
        ledgerId,
        transactions: transactionsData,
      },
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error importing transactions:", err);
    throw err;
  }
};

// Import Transactions directly from CSV file
export const importTransactionsFromFile = async (ledgerId, file) => {
  try {
    setupAxiosDefaults(); // Ensure token is set

    // Create form data
    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("ledgerId", ledgerId);

    const res = await api.post("/api/transactions/import/file", formData, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error importing transactions from file:", err);
    throw err;
  }
};

// Admin API - Users
export const getUsers = async () => {
  try {
    // Check if user is admin before making the request
    let user;
    try {
      const userStr = localStorage.getItem("user");
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      user = null;
    }

    if (!user || user.role !== "admin") {
      console.log("Users API endpoint is admin-only. Skipping request.");
      throw new Error("Admin access required");
    }

    setupAxiosDefaults(); // Ensure token is set
    const res = await api.get("/api/users", {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err;
  }
};

export const inviteUser = async (userData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.post("/api/users", userData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error inviting user:", err);
    throw err;
  }
};

export const updateUser = async (id, userData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.put(`/api/users/${id}`, userData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error updating user ${id}:`, err);
    throw err;
  }
};

export const deleteUser = async (id) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.delete(`/api/users/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error deleting user ${id}:`, err);
    throw err;
  }
};

// Admin API - Ledgers
export const createLedger = async (ledgerData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.post("/api/ledgers", ledgerData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error creating ledger:", err);
    throw err;
  }
};

export const updateLedger = async (id, ledgerData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.put(`/api/ledgers/${id}`, ledgerData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error updating ledger ${id}:`, err);
    throw err;
  }
};

export const deleteLedger = async (id) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await axios.delete(`/api/ledgers/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error deleting ledger ${id}:`, err);
    throw err;
  }
};

// Admin API - Transactions
export const createTransaction = async (transactionData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await axios.post("/api/transactions", transactionData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error creating transaction:", err);
    throw err;
  }
};

export const updateTransaction = async (id, transactionData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await axios.put(`/api/transactions/${id}`, transactionData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error updating transaction ${id}:`, err);
    throw err;
  }
};

export const deleteTransaction = async (id) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await axios.delete(`/api/transactions/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error deleting transaction ${id}:`, err);
    throw err;
  }
};

// Messages API
export const sendMessage = async (messageData) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.post("/api/messages", messageData, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
};

export const getMessages = async () => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.get("/api/messages", {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching messages:", err);
    throw err;
  }
};

export const markMessageAsRead = async (id) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.put(
      `/api/messages/${id}/read`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  } catch (err) {
    console.error(`Error marking message ${id} as read:`, err);
    throw err;
  }
};

export const deleteMessage = async (id) => {
  try {
    setupAxiosDefaults(); // Ensure token is set
    const res = await api.delete(`/api/messages/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (err) {
    console.error(`Error deleting message ${id}:`, err);
    throw err;
  }
};
