import React, { useState, useEffect } from "react";
import {
  getLedgers,
  getLedgerById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../utils/api";
import { formatDate, formatCurrency } from "../../utils/helpers";

const TransactionManagement = () => {
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    ledgerId: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
  });
  const [editTransactionId, setEditTransactionId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    description: "",
    amount: "",
  });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const data = await getLedgers();
        setLedgers(data);

        // Auto-select first ledger if available
        if (data.length > 0) {
          setSelectedLedgerId(data[0]._id);
          fetchTransactionsForLedger(data[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching ledgers:", err);
        setError("Failed to load ledgers. Please try again.");
        setLoading(false);
      }
    };

    fetchLedgers();
  }, []);

  const fetchTransactionsForLedger = async (ledgerId) => {
    try {
      setLoading(true);

      const ledgerData = await getLedgerById(ledgerId);
      setTransactions(ledgerData.transactions);

      setLoading(false);
    } catch (err) {
      console.error(`Error fetching transactions for ledger ${ledgerId}:`, err);
      setError("Failed to load transactions. Please try again.");
      setLoading(false);
    }
  };

  const handleLedgerChange = (e) => {
    const newLedgerId = e.target.value;
    setSelectedLedgerId(newLedgerId);

    if (newLedgerId) {
      fetchTransactionsForLedger(newLedgerId);
    } else {
      setTransactions([]);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: value,
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    try {
      // Format data for API
      const transactionData = {
        ...createFormData,
        ledgerId: selectedLedgerId,
        amount: parseFloat(createFormData.amount),
      };

      const newTransaction = await createTransaction(transactionData);

      // Update local state
      fetchTransactionsForLedger(selectedLedgerId);

      // Reset form
      setCreateFormData({
        ledgerId: selectedLedgerId,
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
      });

      setShowCreateForm(false);
      setSuccess("Transaction created successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error creating transaction:", err);
      setError("Failed to create transaction. Please try again.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      // Format data for API
      const transactionData = {
        ...editFormData,
        amount: parseFloat(editFormData.amount),
      };

      await updateTransaction(editTransactionId, transactionData);

      // Update local state
      fetchTransactionsForLedger(selectedLedgerId);

      // Reset form
      setEditTransactionId(null);
      setSuccess("Transaction updated successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(`Error updating transaction ${editTransactionId}:`, err);
      setError("Failed to update transaction. Please try again.");
    }
  };

  const startEdit = (transaction) => {
    setEditTransactionId(transaction._id);
    setEditFormData({
      date: new Date(transaction.date).toISOString().split("T")[0],
      description: transaction.description,
      amount: transaction.amount.toString(),
    });
  };

  const cancelEdit = () => {
    setEditTransactionId(null);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);

        // Update local state
        fetchTransactionsForLedger(selectedLedgerId);
      } catch (err) {
        console.error(`Error deleting transaction ${transactionId}:`, err);
        setError("Failed to delete transaction. Please try again.");
      }
    }
  };

  if (loading && ledgers.length === 0) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="transaction-management">
      <h1 className="mb-3">Transaction Management</h1>

      {error && (
        <p className="mb-3" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="mb-3" style={{ color: "var(--success-color)" }}>
          {success}
        </p>
      )}

      <div className="card mb-3">
        <div className="form-group">
          <label htmlFor="ledger-select" className="form-label">
            Select Ledger
          </label>
          <select
            id="ledger-select"
            className="form-input"
            value={selectedLedgerId}
            onChange={handleLedgerChange}
          >
            <option value="">Select a Ledger</option>
            {ledgers.map((ledger) => (
              <option key={ledger._id} value={ledger._id}>
                {ledger.name} ({ledger.currency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedLedgerId && (
        <>
          <div className="admin-actions">
            <button
              className="btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancel" : "Add Transaction"}
            </button>
          </div>

          {showCreateForm && (
            <div className="card mb-3">
              <h3 className="mb-2">Add Transaction</h3>
              <form onSubmit={handleCreateSubmit}>
                <div className="form-group">
                  <label htmlFor="date" className="form-label">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-input"
                    value={createFormData.date}
                    onChange={handleCreateChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="form-input"
                    value={createFormData.description}
                    onChange={handleCreateChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Amount (positive for deposits, negative for expenses)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    className="form-input"
                    value={createFormData.amount}
                    onChange={handleCreateChange}
                    step="0.01"
                    required
                  />
                </div>

                <button type="submit" className="btn">
                  Add Transaction
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading transactions...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        {editTransactionId === transaction._id ? (
                          // Edit form row
                          <td colSpan="5">
                            <form
                              onSubmit={handleEditSubmit}
                              className="flex-between"
                            >
                              <div
                                className="form-group"
                                style={{ marginBottom: 0, marginRight: "10px" }}
                              >
                                <input
                                  type="date"
                                  name="date"
                                  className="form-input"
                                  value={editFormData.date}
                                  onChange={handleEditChange}
                                  required
                                />
                              </div>

                              <div
                                className="form-group"
                                style={{
                                  marginBottom: 0,
                                  marginRight: "10px",
                                  flex: 1,
                                }}
                              >
                                <input
                                  type="text"
                                  name="description"
                                  className="form-input"
                                  value={editFormData.description}
                                  onChange={handleEditChange}
                                  required
                                />
                              </div>

                              <div
                                className="form-group"
                                style={{ marginBottom: 0, marginRight: "10px" }}
                              >
                                <input
                                  type="number"
                                  name="amount"
                                  className="form-input"
                                  value={editFormData.amount}
                                  onChange={handleEditChange}
                                  step="0.01"
                                  required
                                />
                              </div>

                              <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                  type="submit"
                                  className="btn"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "14px",
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="btn btn-secondary"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "14px",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        ) : (
                          // Normal row
                          <>
                            <td>{formatDate(transaction.date)}</td>
                            <td>{transaction.description}</td>
                            <td>
                              <span
                                className={
                                  transaction.amount >= 0
                                    ? "positive"
                                    : "negative"
                                }
                              >
                                {formatCurrency(
                                  transaction.amount,
                                  ledgers.find(
                                    (l) => l._id === selectedLedgerId
                                  )?.currency
                                )}
                              </span>
                            </td>
                            <td>
                              <span
                                className={
                                  transaction.balance >= 0
                                    ? "positive"
                                    : "negative"
                                }
                              >
                                {formatCurrency(
                                  transaction.balance,
                                  ledgers.find(
                                    (l) => l._id === selectedLedgerId
                                  )?.currency
                                )}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                  onClick={() => startEdit(transaction)}
                                  className="btn"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "14px",
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTransaction(transaction._id)
                                  }
                                  className="btn btn-secondary"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "14px",
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionManagement;
