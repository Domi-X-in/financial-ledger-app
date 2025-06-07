// client/src/components/Ledger/TransactionCSVImport.js
import React, { useState } from "react";
import {
  downloadTransactionTemplate,
  importTransactionsFromCSV,
} from "../../utils/api";
import {
  downloadTransactionsAsCSV,
  validateTransaction,
} from "../../utils/csvUtils";
import Papa from "papaparse";
import DirectFileUpload from "./DirectFileUpload";

const TransactionCSVImport = ({
  ledgerId,
  transactions,
  ledgerName,
  onImportSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("clientParse"); // "clientParse" or "directUpload"

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await downloadTransactionTemplate();
    } catch (err) {
      setError("Failed to download template. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTransactions = () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!transactions || transactions.length === 0) {
        setError("No transactions to export");
        return;
      }

      downloadTransactionsAsCSV(transactions, ledgerName);
      setSuccess("Transactions exported successfully");
    } catch (err) {
      setError("Failed to export transactions. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file");
      setIsLoading(false);
      return;
    }

    // Parse CSV file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setIsLoading(false);
            return;
          }

          // Process and validate data
          const processedData = [];
          const validationErrors = [];

          results.data.forEach((row, index) => {
            // Create transaction object from row
            const transaction = {
              date: row.date,
              description: row.description,
              amount:
                row.amount !== undefined && row.amount !== ""
                  ? parseFloat(row.amount)
                  : undefined,
            };

            // Validate transaction
            const { isValid, errors } = validateTransaction(transaction, index);

            if (isValid) {
              processedData.push(transaction);
            } else {
              validationErrors.push(...errors);
            }
          });

          // If there are validation errors, stop and display them
          if (validationErrors.length > 0) {
            setError(`Validation errors:\n${validationErrors.join("\n")}`);
            setIsLoading(false);
            return;
          }

          const transactions = processedData;

          // Send to server
          const response = await importTransactionsFromCSV(
            ledgerId,
            transactions
          );
          setSuccess(`Successfully imported ${response.count} transactions`);

          // Notify parent component to refresh data
          if (onImportSuccess) {
            onImportSuccess();
          }
        } catch (err) {
          if (err.response && err.response.data) {
            if (err.response.data.errors) {
              // Format validation errors
              const errorList = err.response.data.errors.join("\n");
              setError(`Import failed with validation errors:\n${errorList}`);
            } else {
              setError(
                err.response.data.message ||
                  "Import failed. Please check your CSV format."
              );
            }
          } else {
            setError("Import failed. Please try again.");
          }
          console.error(err);
        } finally {
          setIsLoading(false);
          // Reset file input
          event.target.value = null;
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsLoading(false);
        // Reset file input
        event.target.value = null;
      },
    });
  };

  // Handle tab switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  };

  // Handle direct upload success
  const handleDirectUploadSuccess = () => {
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  return (
    <div className="transaction-csv-import">
      <div className="csv-actions">
        <div className="button-group">
          <button
            className="btn btn-outline"
            onClick={handleDownloadTemplate}
            disabled={isLoading}
          >
            Download CSV Template
          </button>

          {transactions && transactions.length > 0 && (
            <button
              className="btn btn-success"
              onClick={handleExportTransactions}
              disabled={isLoading}
            >
              Export Current Transactions
            </button>
          )}
        </div>
      </div>

      <div className="import-tabs">
        <div className="tab-header">
          <button
            className={`tab-btn ${activeTab === "clientParse" ? "active" : ""}`}
            onClick={() => handleTabChange("clientParse")}
          >
            Client-side Import
          </button>
          <button
            className={`tab-btn ${
              activeTab === "directUpload" ? "active" : ""
            }`}
            onClick={() => handleTabChange("directUpload")}
          >
            Direct Upload
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "clientParse" && (
            <div className="tab-pane">
              <p className="import-note">
                Import and validate CSV data in your browser before sending to
                server.
              </p>
              <div className="file-upload-container">
                <label className="btn btn-primary">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    style={{ display: "none" }}
                  />
                  Import from CSV
                </label>
              </div>
            </div>
          )}

          {activeTab === "directUpload" && (
            <div className="tab-pane">
              <p className="import-note">
                Upload CSV file directly to the server for processing.
              </p>
              <DirectFileUpload
                ledgerId={ledgerId}
                onUploadSuccess={handleDirectUploadSuccess}
              />
            </div>
          )}
        </div>
      </div>

      {isLoading && <div className="loading">Processing...</div>}

      {error && (
        <div className="error-message">
          {error.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default TransactionCSVImport;
