// client/src/components/Ledger/TransactionTable.js
import React, { useState } from "react";
import { formatDate, formatCurrency } from "../../utils/helpers";
import TransactionCSVImport from "./TransactionCSVImport";

const TransactionTable = ({
  transactions,
  currency,
  ledgerId,
  ledgerName,
  onDataChange,
}) => {
  const [showImport, setShowImport] = useState(false);

  const handleImportSuccess = () => {
    // Call parent component's refresh method if provided
    if (onDataChange) {
      onDataChange();
    }
  };

  return (
    <div className="transaction-table">
      <div className="table-actions">
        <button
          className="btn btn-secondary"
          onClick={() => setShowImport(!showImport)}
        >
          {showImport ? "Hide Import Options" : "CSV Import/Export"}
        </button>

        {showImport && (
          <TransactionCSVImport
            ledgerId={ledgerId}
            transactions={transactions}
            ledgerName={ledgerName}
            onImportSuccess={handleImportSuccess}
          />
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td>
                    <span
                      className={`transaction-amount ${
                        transaction.amount >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {formatCurrency(transaction.amount, currency)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        transaction.balance >= 0 ? "positive" : "negative"
                      }
                    >
                      {formatCurrency(transaction.balance, currency)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
