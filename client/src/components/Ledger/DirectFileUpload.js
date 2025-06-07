// client/src/components/Ledger/DirectFileUpload.js
import React, { useState, useRef } from "react";
import axios from "axios";

const DirectFileUpload = ({ ledgerId, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    event.preventDefault();

    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setError("Please select a CSV file to upload");
      return;
    }

    const file = fileInput.files[0];

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file");
      return;
    }

    // Reset states
    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("csvFile", file);
      formData.append("ledgerId", ledgerId);

      // Get auth token
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Make POST request
      const response = await axios.post(
        "/api/transactions/import/file",
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle success
      setSuccess(`Successfully imported ${response.data.count} transactions`);

      // Clear file input
      if (fileInput) {
        fileInput.value = "";
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      // Handle error
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
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="direct-file-upload">
      <form onSubmit={handleFileUpload}>
        <div className="form-group">
          <label htmlFor="csvFileUpload" className="file-label">
            <span>Select CSV File</span>
            <input
              type="file"
              id="csvFileUpload"
              ref={fileInputRef}
              accept=".csv"
              className="file-input"
              disabled={uploading}
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload & Import"}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        {success && <div className="success-message">{success}</div>}
      </form>
    </div>
  );
};

export default DirectFileUpload;
