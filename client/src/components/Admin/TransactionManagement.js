import React, { useState, useEffect } from "react";
import {
  getLedgers,
  getLedgerById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../utils/api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import styles from './TransactionManagement.module.css';

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
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
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

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.clear(); // Only allow one selection
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTransactions.size} transaction(s)?`)) {
      try {
        await Promise.all(
          Array.from(selectedTransactions).map(id => deleteTransaction(id))
        );
        fetchTransactionsForLedger(selectedLedgerId);
        setSelectedTransactions(new Set());
        setSuccess(`${selectedTransactions.size} transaction(s) deleted successfully!`);
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        console.error("Error deleting transactions:", err);
        setError("Failed to delete transactions. Please try again.");
      }
    }
  };

  const handleBulkEdit = () => {
    if (selectedTransactions.size !== 1) {
      setError("Please select exactly one transaction to edit.");
      return;
    }
    const transaction = transactions.find(t => t._id === Array.from(selectedTransactions)[0]);
    setEditFormData({
      date: new Date(transaction.date).toISOString().split("T")[0],
      description: transaction.description,
      amount: transaction.amount.toString(),
    });
  };

  const handleBulkEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await Promise.all(
        Array.from(selectedTransactions).map(id =>
          updateTransaction(id, {
            ...editFormData,
            amount: parseFloat(editFormData.amount),
          })
        )
      );
      fetchTransactionsForLedger(selectedLedgerId);
      setSelectedTransactions(new Set());
      setEditFormData({ date: "", description: "", amount: "" });
      setSuccess("Transaction(s) updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating transactions:", err);
      setError("Failed to update transactions. Please try again.");
    }
  };

  const isCheckboxDisabled = (transactionId) => {
    return selectedTransactions.size === 1 && !selectedTransactions.has(transactionId);
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
          <h3 className="edit-title" id="ledger-select-label">
            Select Ledger
          </h3>
          <select
            id="ledger-select"
            className="form-input"
            value={selectedLedgerId}
            onChange={handleLedgerChange}
            aria-labelledby="ledger-select-label"
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
            <button
              className="btn"
              onClick={handleBulkEdit}
              disabled={!selectedTransactions.size}
            >
              Edit
            </button>
            <button
              className="btn"
              onClick={handleBulkDelete}
              disabled={!selectedTransactions.size}
            >
              Delete
            </button>
          </div>

          {showCreateForm && (
            <div className="card mb-3">
              <h3 className="edit-title mb-2">Add Transaction</h3>
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
                    Amount
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

                <button type="submit" className="btn mb-3">
                  Add Transaction
                </button>
              </form>
            </div>
          )}

          {editFormData.date && (
            <div className="card mb-3">
              <h3 className="edit-title mb-2">Edit Transaction</h3>
              <form onSubmit={handleBulkEditSubmit}>
                <div className="edit-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="edit-date" className="edit-form-label">
                      Date
                    </label>
                    <input
                      type="date"
                      id="edit-date"
                      name="date"
                      className="form-input"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="edit-amount" className="edit-form-label">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="edit-amount"
                      name="amount"
                      className="form-input"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description" className="edit-form-label">
                    Description
                  </label>
                  <input
                    type="text"
                    id="edit-description"
                    name="description"
                    className="form-input"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    required
                  />
                </div>
                <div className={styles['edit-actions']}>
                  <button type="submit" className="btn">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditFormData({ date: "", description: "", amount: "" });
                      setSelectedTransactions(new Set());
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading transactions...</div>
          ) : (
            <div className="table-container" style={{overflowX: 'auto'}}>
              <table className={`${styles['responsive-table']} table`}>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size === transactions.length}
                        onChange={handleSelectAll}
                        className={styles['select-checkbox']}
                      />
                    </th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance</th>
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
                      <tr 
                        key={transaction._id}
                        className={selectedTransactions.has(transaction._id) ? styles['selected-row'] : ''}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction._id)}
                            onChange={() => handleSelectTransaction(transaction._id)}
                            className={styles['select-checkbox']}
                            disabled={isCheckboxDisabled(transaction._id)}
                          />
                        </td>
                        <td>{formatDate(transaction.date)}</td>
                        <td><span className={styles.ellipsis}>{transaction.description}</span></td>
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