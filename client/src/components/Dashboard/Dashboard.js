// client/src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLedgers, getLedgerById } from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [ledgers, setLedgers] = useState([]);
  const [ledgerBalances, setLedgerBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("USD");
  const navigate = useNavigate();
  const { user, token, isAdmin } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ensure token is set for all requests
        const currentToken = localStorage.getItem("token");
        if (currentToken) {
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${currentToken}`;
        }

        // Get ledger data - this is essential
        const ledgersData = await getLedgers();
        console.log("Fetched ledgers:", ledgersData);
        setLedgers(ledgersData);
        setLoading(false);

        // Fetch balances as a separate operation
        try {
          const balances = {};
          for (const ledger of ledgersData) {
            try {
              // Reset authorization header for each request
              if (currentToken) {
                axios.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${currentToken}`;
              }

              const ledgerDetails = await getLedgerById(ledger._id);
              // Get balance from the last transaction or set to 0
              const transactions = ledgerDetails.transactions || [];
              const balance =
                transactions.length > 0
                  ? transactions[transactions.length - 1].balance
                  : 0;

              balances[ledger._id] = balance;
            } catch (detailErr) {
              console.error(
                `Error fetching details for ledger ${ledger._id}:`,
                detailErr
              );
              balances[ledger._id] = 0;
            }
          }
          setLedgerBalances(balances);
        } catch (balanceErr) {
          console.error("Error fetching balances:", balanceErr);
          // Continue without balance data
        }
      } catch (err) {
        console.error("Error fetching ledger data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [token]); // Add token as dependency to re-fetch when token changes

  // Filter ledgers based on selected currency
  const filteredLedgers = ledgers.filter(
    (ledger) => ledger.currency === currencyFilter
  );

  // Calculate total balance across filtered ledgers
  const calculateTotalBalance = () => {
    let total = 0;
    for (const ledger of filteredLedgers) {
      total += ledgerBalances[ledger._id] || 0;
    }
    return total;
  };

  // Navigate to ledger details page
  const handleLedgerClick = (ledgerId) => {
    navigate(`/ledger/${ledgerId}`);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Safety check for user object
  if (!user) {
    return <div className="loading">Loading user information...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="mb-3">Dashboard</h1>

      {error && (
        <p className="mb-3" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}

      {/* Currency filter buttons */}
      <div className="card">
        <h3 className="mb-2">Currency Filter</h3>
        <div className="grid grid-2" style={{ maxWidth: "300px" }}>
          <button
            className={`btn ${currencyFilter === "USD" ? "" : "btn-secondary"}`}
            onClick={() => setCurrencyFilter("USD")}
          >
            USD
          </button>
          <button
            className={`btn ${currencyFilter === "BTC" ? "" : "btn-secondary"}`}
            onClick={() => setCurrencyFilter("BTC")}
          >
            BTC
          </button>
        </div>
      </div>

      <div className="card mt-3">
        <h2 className="mb-3">Ledger Accounts Summary</h2>

        <div className="table-container" style={{overflowX: 'auto'}}>
          <table className={`${styles['responsive-table']} table`}>
            <thead>
              <tr>
                <th>Your Access</th>
                <th>Ledger Name</th>
                <th>Balance</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    No ledgers found.
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((ledger) => {
                  // Safely determine access level with null checks
                  let permission = "none";

                  // Check if user is admin
                  if (user && user.role === "admin") permission = "admin";

                  // Check if user is owner (with null checks)
                  if (user && user._id && ledger.owner) {
                    const ownerId =
                      typeof ledger.owner === "object"
                        ? ledger.owner._id
                        : ledger.owner;
                    if (user._id.toString() === ownerId.toString()) {
                      permission = "owner";
                    }
                  }

                  // Check if user has explicit permissions
                  if (
                    user &&
                    user._id &&
                    ledger.permissions &&
                    Array.isArray(ledger.permissions)
                  ) {
                    const userPerm = ledger.permissions.find(
                      (p) =>
                        p.user &&
                        user._id &&
                        p.user.toString() === user._id.toString()
                    );
                    if (userPerm) permission = userPerm.role;
                  }

                  return (
                    <tr
                      key={ledger._id}
                      onClick={() => handleLedgerClick(ledger._id)}
                      style={{ cursor: "pointer" }}
                      className="ledger-row"
                    >
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 6px",
                            borderRadius: "3px",
                            fontWeight: "bold",
                            fontSize: "0.8rem",
                            color: "white",
                            backgroundColor:
                              permission === "none"
                                ? "#17a2b8" // Change to same color as viewer
                                : permission === "viewer"
                                ? "#17a2b8"
                                : permission === "editor"
                                ? "#ffc107"
                                : permission === "admin"
                                ? "#28a745"
                                : "#28a745",
                          }}
                        >
                          {permission === "owner"
                            ? "Owner"
                            : permission === "admin"
                            ? "Admin"
                            : permission === "editor"
                            ? "Editor"
                            : "Viewer"}{" "}
                          {/* Always show Viewer instead of No Access */}
                        </span>
                      </td>
                      <td><span className={styles.ellipsis}>{ledger.name}</span></td>
                      <td
                        className={
                          (ledgerBalances[ledger._id] || 0) >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {formatCurrency(
                          ledgerBalances[ledger._id] || 0,
                          ledger.currency
                        )}
                      </td>
                      <td>{ledger.currency}</td>
                    </tr>
                  );
                })
              )}

              {/* Total row - only shown when there are ledgers */}
              {filteredLedgers.length > 0 && (
                <tr>
                  <td></td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    Total Balance:
                  </td>
                  <td
                    className={
                      calculateTotalBalance() >= 0 ? "positive" : "negative"
                    }
                  >
                    {formatCurrency(calculateTotalBalance(), currencyFilter)}
                  </td>
                  <td>{currencyFilter}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
