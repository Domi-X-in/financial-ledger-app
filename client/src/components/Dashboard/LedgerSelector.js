// client/src/components/Dashboard/LedgerSelector.js
import React from "react";
import { Link } from "react-router-dom";

const LedgerSelector = ({ ledgers }) => {
  return (
    <div className="ledger-selector">
      <h2 className="mb-2">Select a Ledger</h2>

      {ledgers.length === 0 ? (
        <p>No ledgers available.</p>
      ) : (
        <div className="grid grid-3">
          {ledgers.map((ledger) => (
            <Link
              to={`/ledger/${ledger._id}`}
              key={ledger._id}
              className="card ledger-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3 className="ledger-title">{ledger.name}</h3>
              <p>Currency: {ledger.currency}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LedgerSelector;
