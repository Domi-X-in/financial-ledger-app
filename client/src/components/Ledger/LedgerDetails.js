// client/src/components/Ledger/LedgerDetails.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getLedgerById, getLedgerTransactions } from "../../utils/api";
import TransactionTable from "./TransactionTable";
import TransactionGraphs from "./TransactionGraphs";

const LedgerDetails = () => {
  const { id } = useParams();
  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ledger data
  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const ledgerData = await getLedgerById(id);
      setLedger(ledgerData);

      // Fetch transactions
      await fetchTransactions();
    } catch (err) {
      console.error("Error fetching ledger details:", err);
      setError("Failed to load ledger details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const transactionsData = await getLedgerTransactions(id);
      setTransactions(transactionsData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again.");
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading ledger details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!ledger) {
    return <div className="not-found">Ledger not found</div>;
  }

  return (
    <div className="ledger-details">
      <h1>{ledger.name}</h1>
      <div className="ledger-info">
        <p>
          <strong>Currency:</strong> {ledger.currency}
        </p>
        <p>
          <strong>Description:</strong> {ledger.description}
        </p>
      </div>

      <div className="transactions-section">
        <h2>Transactions</h2>
        <TransactionTable
          transactions={transactions}
          currency={ledger.currency}
          ledgerId={id}
          ledgerName={ledger.name}
          onDataChange={fetchTransactions}
        />
      </div>

      {transactions.length > 0 && (
        <div className="graphs-section">
          <h2>Analytics</h2>
          <TransactionGraphs
            transactions={transactions}
            currency={ledger.currency}
          />
        </div>
      )}
    </div>
  );
};

export default LedgerDetails;
