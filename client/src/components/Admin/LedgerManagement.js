import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  getLedgers,
  getUsers,
  createLedger,
  updateLedger,
  deleteLedger,
  updateLedgerPermissions,
  getAllTransactions,
} from "../../utils/api";

const LedgerManagement = () => {
  const [ledgers, setLedgers] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]); // Identified admin users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    ownerId: "",
    currency: "USD",
    description: "",
    permissions: [],
  });
  // State for editing permissions
  const [editingPermissionsForLedgerId, setEditingPermissionsForLedgerId] =
    useState(null);
  // State for ledger name editing
  const [editingLedgerName, setEditingLedgerName] = useState("");
  const [success, setSuccess] = useState("");
  // New state to track which ledger has the "Add User" dropdown visible
  const [addUserDropdownLedgerId, setAddUserDropdownLedgerId] = useState(null);
  const [newUserSelectValue, setNewUserSelectValue] = useState("");
  const [exporting, setExporting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ledgersData, usersData] = await Promise.all([
          getLedgers(),
          getUsers(),
        ]);

        setLedgers(ledgersData);
        setUsers(usersData);

        // Identify admin users by checking existing ledger permissions
        const adminUserIds = new Set();

        // Find all users who have admin role in any ledger
        ledgersData.forEach((ledger) => {
          if (ledger.permissions && Array.isArray(ledger.permissions)) {
            ledger.permissions.forEach((permission) => {
              if (permission.role === "admin") {
                adminUserIds.add(permission.user);
              }
            });
          }
        });

        // Find users who are admins
        const identifiedAdmins = usersData.filter((user) =>
          adminUserIds.has(user._id)
        );

        // If no admins were found in permissions, default to all users
        // This handles first-time setup when no ledgers/permissions exist yet
        setAdminUsers(
          identifiedAdmins.length > 0 ? identifiedAdmins : usersData
        );

        // Check if we should show the create form based on location state
        if (location.state?.showCreateForm) {
          setShowCreateForm(true);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  // Helper function to get user info for a ledger
  const getUsersInfo = (ledger) => {
    if (!ledger.permissions || !ledger.permissions.length) {
      return [{ name: "No users", email: "-", role: "-" }];
    }

    return ledger.permissions
      .map((permission) => {
        const user = users.find((u) => u._id === permission.user);
        if (user) {
          return {
            userId: permission.user,
            name: user.name,
            email: user.email,
            role: permission.role || "viewer",
          };
        }
        return null;
      })
      .filter(Boolean); // Remove nulls
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;

    // If changing owner, set up their admin permission automatically
    if (name === "ownerId") {
      setCreateFormData({
        ...createFormData,
        [name]: value,
        permissions: value ? [{ user: value, role: "admin" }] : [],
      });
    } else {
      setCreateFormData({
        ...createFormData,
        [name]: value,
      });
    }
  };

  const handleCreateSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate owner is selected
    if (!createFormData.ownerId) {
      setError("Please select an owner for the ledger");
      return;
    }

    try {
      // Ensure permissions include admin for owner
      const formDataToSubmit = {
        ...createFormData,
        permissions: [{ user: createFormData.ownerId, role: "admin" }],
      };

      const newLedger = await createLedger(formDataToSubmit);

      // Update local state
      setLedgers([...ledgers, newLedger]);

      // Update admin users list to include this user if not already there
      if (!adminUsers.some((user) => user._id === createFormData.ownerId)) {
        const newAdmin = users.find(
          (user) => user._id === createFormData.ownerId
        );
        if (newAdmin) {
          setAdminUsers([...adminUsers, newAdmin]);
        }
      }

      // Reset form
      setCreateFormData({
        name: "",
        ownerId: "",
        currency: "USD",
        description: "",
        permissions: [],
      });

      setShowCreateForm(false);
      setSuccess("Ledger created successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error creating ledger:", err);
      setError("Failed to create ledger. Please try again.");
    }
  };

  const handleDeleteLedger = async (ledgerId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this ledger? All associated transactions will also be deleted."
      )
    ) {
      try {
        await deleteLedger(ledgerId);

        // Update local state
        setLedgers(ledgers.filter((ledger) => ledger._id !== ledgerId));
      } catch (err) {
        console.error(`Error deleting ledger ${ledgerId}:`, err);
        setError("Failed to delete ledger. Please try again.");
      }
    }
  };

  // Modified to enable inline editing mode for both name and permissions
  const handleManagePermissions = (ledger) => {
    // Set the ledger ID we're editing
    setEditingPermissionsForLedgerId(ledger._id);

    // Initialize current ledger name for editing
    setEditingLedgerName(ledger.name);

    // Reset add user dropdown
    setAddUserDropdownLedgerId(null);
    setNewUserSelectValue("");
  };

  // Show the Add User dropdown in the proper location
  const handleAddUser = (ledgerId) => {
    setAddUserDropdownLedgerId(ledgerId);
    setNewUserSelectValue("");
  };

  // Handle selection from the Add User dropdown
  const handleUserSelect = (e) => {
    const userId = e.target.value;
    if (!userId) return;

    const ledger = ledgers.find((l) => l._id === editingPermissionsForLedgerId);
    if (!ledger) return;

    // Add the new user permission
    const updatedPermissions = [...(ledger.permissions || [])];
    updatedPermissions.push({ user: userId, role: "viewer" });

    // Update the ledger in state
    setLedgers(
      ledgers.map((l) =>
        l._id === editingPermissionsForLedgerId
          ? { ...l, permissions: updatedPermissions }
          : l
      )
    );

    // Hide the dropdown
    setAddUserDropdownLedgerId(null);
    setNewUserSelectValue("");
  };

  // Handle ledger name change
  const handleLedgerNameChange = (e) => {
    setEditingLedgerName(e.target.value);
  };

  // Remove a user's permission from the current ledger
  const handleRemoveUser = (userId) => {
    const ledger = ledgers.find((l) => l._id === editingPermissionsForLedgerId);
    if (!ledger) return;

    const updatedPermissions = (ledger.permissions || []).filter(
      (p) => p.user !== userId
    );

    // Update the ledger in state temporarily
    setLedgers(
      ledgers.map((l) =>
        l._id === editingPermissionsForLedgerId
          ? { ...l, permissions: updatedPermissions }
          : l
      )
    );
  };

  // Change a user's role for the current ledger
  const handleRoleChange = (userId, newRole) => {
    const ledger = ledgers.find((l) => l._id === editingPermissionsForLedgerId);
    if (!ledger) return;

    const updatedPermissions = (ledger.permissions || []).map((p) =>
      p.user === userId ? { ...p, role: newRole } : p
    );

    // Update the ledger in state temporarily
    setLedgers(
      ledgers.map((l) =>
        l._id === editingPermissionsForLedgerId
          ? { ...l, permissions: updatedPermissions }
          : l
      )
    );

    // If role changed to admin, add this user to adminUsers if not already there
    if (
      newRole === "admin" &&
      !adminUsers.some((user) => user._id === userId)
    ) {
      const newAdmin = users.find((user) => user._id === userId);
      if (newAdmin) {
        setAdminUsers([...adminUsers, newAdmin]);
      }
    }
  };

  // Save the updated ledger name and permissions
  const handleSavePermissions = async () => {
    const ledger = ledgers.find((l) => l._id === editingPermissionsForLedgerId);
    if (!ledger) return;

    // Filter out any incomplete permissions
    const validPermissions = (ledger.permissions || []).filter((p) => p.user);

    try {
      // Update ledger name if changed
      if (editingLedgerName !== ledger.name) {
        await updateLedger(editingPermissionsForLedgerId, {
          name: editingLedgerName,
        });
      }

      // Update permissions
      await updateLedgerPermissions(editingPermissionsForLedgerId, {
        permissions: validPermissions,
      });

      // Refresh ledgers data to ensure we have latest state
      const ledgersData = await getLedgers();
      setLedgers(ledgersData);

      // Update admin users based on new permissions
      const updatedAdminUserIds = new Set();

      // Find all users who have admin role in any ledger
      ledgersData.forEach((l) => {
        if (l.permissions && Array.isArray(l.permissions)) {
          l.permissions.forEach((permission) => {
            if (permission.role === "admin") {
              updatedAdminUserIds.add(permission.user);
            }
          });
        }
      });

      // Update admin users list
      const identifiedAdmins = users.filter((user) =>
        updatedAdminUserIds.has(user._id)
      );
      setAdminUsers(identifiedAdmins.length > 0 ? identifiedAdmins : users);

      // Update successful
      setSuccess("Ledger updated successfully!");

      // Exit permissions editing mode
      setEditingPermissionsForLedgerId(null);
      setEditingLedgerName("");
      setAddUserDropdownLedgerId(null);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(`Error updating ledger:`, err);
      setError("Failed to update ledger. Please try again.");
    }
  };

  // Cancel editing
  const cancelPermissions = () => {
    // Revert any unsaved changes by re-fetching data
    const fetchData = async () => {
      try {
        const ledgersData = await getLedgers();
        setLedgers(ledgersData);
      } catch (err) {
        console.error("Error refreshing data:", err);
      }
    };

    fetchData();

    // Exit editing mode
    setEditingPermissionsForLedgerId(null);
    setEditingLedgerName("");
    setAddUserDropdownLedgerId(null);
  };

  // Toggle create form
  const toggleCreateForm = () => {
    // Reset form data when opening form
    if (!showCreateForm) {
      setCreateFormData({
        name: "",
        ownerId: "",
        currency: "USD",
        description: "",
        permissions: [],
      });
    }
    setShowCreateForm(!showCreateForm);
  };

  // Cancel create form
  const cancelCreate = () => {
    setShowCreateForm(false);
    setCreateFormData({
      name: "",
      ownerId: "",
      currency: "USD",
      description: "",
      permissions: [],
    });
  };

  // Export to Excel function
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      setError("");

      // Fetch all transactions to include in the export
      const allTransactions = await getAllTransactions();

      // Prepare data for Excel sheets
      const ledgersData = prepareLedgersData();
      const permissionsData = preparePermissionsData();
      const transactionsData = prepareTransactionsData(allTransactions);

      // Create workbook and add sheets
      const wb = XLSX.utils.book_new();

      // Add Ledgers sheet
      const ledgersWs = XLSX.utils.json_to_sheet(ledgersData);

      // Set column widths for Ledgers sheet
      const ledgersColInfo = [
        { wch: 24 }, // ID
        { wch: 20 }, // Name
        { wch: 10 }, // Currency
        { wch: 20 }, // Owner
        { wch: 30 }, // OwnerEmail
        { wch: 30 }, // Description
        { wch: 15 }, // CreatedAt
      ];
      ledgersWs["!cols"] = ledgersColInfo;

      XLSX.utils.book_append_sheet(wb, ledgersWs, "Ledgers");

      // Add Permissions sheet
      const permissionsWs = XLSX.utils.json_to_sheet(permissionsData);

      // Set column widths for Permissions sheet
      const permissionsColInfo = [
        { wch: 24 }, // LedgerID
        { wch: 20 }, // LedgerName
        { wch: 24 }, // UserID
        { wch: 20 }, // UserName
        { wch: 30 }, // Email
        { wch: 10 }, // Role
      ];
      permissionsWs["!cols"] = permissionsColInfo;

      XLSX.utils.book_append_sheet(wb, permissionsWs, "Permissions");

      // Add Transactions sheet
      const transactionsWs = XLSX.utils.json_to_sheet(transactionsData);

      // Set column widths for Transactions sheet
      const transactionsColInfo = [
        { wch: 24 }, // TransactionID
        { wch: 24 }, // LedgerID
        { wch: 20 }, // LedgerName
        { wch: 15 }, // Date
        { wch: 30 }, // Description
        { wch: 15 }, // Category
        { wch: 10 }, // Type
        { wch: 12 }, // Amount
        { wch: 15 }, // RunningBalance
      ];
      transactionsWs["!cols"] = transactionsColInfo;

      XLSX.utils.book_append_sheet(wb, transactionsWs, "Transactions");

      // Export the file with current date in filename
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD format
      XLSX.writeFile(wb, `ledgers_export_${dateStr}.xlsx`);

      setExporting(false);
      setSuccess("Export completed successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      setError("Failed to export data. Please try again.");
      setExporting(false);
    }
  };

  // Prepare ledgers data for Excel
  const prepareLedgersData = () => {
    return ledgers.map((ledger) => {
      const owner = findOwner(ledger);
      return {
        ID: ledger._id || "",
        Name: ledger.name || "",
        Currency: ledger.currency || "USD",
        Owner: owner ? owner.name : "Unknown",
        OwnerEmail: owner ? owner.email : "",
        Description: ledger.description || "",
        CreatedAt: ledger.createdAt
          ? new Date(ledger.createdAt).toLocaleDateString()
          : "",
      };
    });
  };

  // Find the owner of a ledger
  const findOwner = (ledger) => {
    if (!ledger.permissions || !Array.isArray(ledger.permissions)) return null;

    // Look for a user with admin role
    const adminPermission = ledger.permissions.find((p) => p.role === "admin");
    if (!adminPermission) return null;

    return users.find((user) => user._id === adminPermission.user);
  };

  // Prepare permissions data for Excel
  const preparePermissionsData = () => {
    const permissionsData = [];

    ledgers.forEach((ledger) => {
      if (!ledger.permissions || !Array.isArray(ledger.permissions)) return;

      ledger.permissions.forEach((permission) => {
        const user = users.find((u) => u._id === permission.user);
        if (user) {
          permissionsData.push({
            LedgerID: ledger._id || "",
            LedgerName: ledger.name || "",
            UserID: user._id || "",
            UserName: user.name || "",
            Email: user.email || "",
            Role: permission.role || "viewer",
          });
        }
      });
    });

    return permissionsData;
  };

  // Prepare transactions data for Excel with running balance
  const prepareTransactionsData = (transactions) => {
    // Group transactions by ledger
    const ledgerTransactions = {};

    transactions.forEach((transaction) => {
      // Get the ledger ID, handling both object reference and string ID
      const ledgerId =
        typeof transaction.ledger === "object"
          ? transaction.ledger?._id
          : transaction.ledger;

      if (!ledgerId) return;

      if (!ledgerTransactions[ledgerId]) {
        ledgerTransactions[ledgerId] = [];
      }
      ledgerTransactions[ledgerId].push(transaction);
    });

    // Process each ledger's transactions with running balance
    const processedTransactions = [];

    Object.keys(ledgerTransactions).forEach((ledgerId) => {
      // Get ledger info
      const ledger = ledgers.find((l) => l._id === ledgerId);
      const ledgerName = ledger ? ledger.name : "Unknown Ledger";
      const currency = ledger ? ledger.currency : "USD";

      // Sort transactions by date
      const sortedTransactions = ledgerTransactions[ledgerId].sort((a, b) => {
        // Handle potentially invalid dates by providing defaults
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB;
      });

      // Calculate running balance
      let runningBalance = 0;

      sortedTransactions.forEach((transaction) => {
        // Get a valid amount or default to 0
        const amount = parseFloat(transaction.amount) || 0;

        // Update running balance based on transaction type
        if (transaction.type === "expense") {
          runningBalance -= amount;
        } else {
          runningBalance += amount;
        }

        // Format the date or provide a placeholder
        let formattedDate = "";
        if (transaction.date) {
          try {
            formattedDate = new Date(transaction.date).toLocaleDateString();
          } catch (err) {
            formattedDate = "Invalid Date";
          }
        }

        processedTransactions.push({
          TransactionID: transaction._id || "",
          LedgerID: ledgerId,
          LedgerName: ledgerName,
          Date: formattedDate,
          Description: transaction.description || "",
          Category: transaction.category || "",
          Type: transaction.type || "income",
          Amount: formatCurrencyValue(amount, currency),
          RunningBalance: formatCurrencyValue(runningBalance, currency),
        });
      });
    });

    return processedTransactions;
  };

  // Helper function to format currency values
  const formatCurrencyValue = (value, currency) => {
    let formattedValue = value;

    // Apply specific formatting based on currency
    if (currency === "BTC") {
      // For Bitcoin, show more decimal places
      formattedValue = value.toFixed(8);
    } else {
      // For USD and other currencies, show 2 decimal places
      formattedValue = value.toFixed(2);
    }

    return formattedValue;
  };

  if (loading) {
    return <div className="loading">Loading ledgers...</div>;
  }

  // Group ledgers with their user permissions for rendering
  const renderTable = () => {
    const tableRows = [];

    // Add the create form row if showing
    if (showCreateForm) {
      tableRows.push(
        <tr key="create-form" className="create-form-row">
          <td>
            <input
              type="text"
              name="name"
              className="form-input"
              value={createFormData.name}
              onChange={handleCreateChange}
              placeholder="Enter Ledger Name"
              style={{ width: "100%" }}
              required
            />
          </td>
          <td>
            <select
              name="currency"
              className="form-input"
              value={createFormData.currency}
              onChange={handleCreateChange}
              style={{ width: "100%" }}
            >
              <option value="USD">USD</option>
              <option value="BTC">BTC</option>
            </select>
          </td>
          <td colSpan="3">
            <select
              name="ownerId"
              className="form-input"
              value={createFormData.ownerId}
              onChange={handleCreateChange}
              style={{ width: "100%" }}
              required
            >
              <option value="">Select Owner</option>
              {adminUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </td>
          <td>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <button
                onClick={handleCreateSubmit}
                className="btn"
                style={{ padding: "4px 6px", fontSize: "12px" }}
                disabled={!createFormData.name || !createFormData.ownerId}
              >
                Create
              </button>
              <button
                onClick={cancelCreate}
                className="btn btn-secondary"
                style={{ padding: "4px 6px", fontSize: "12px" }}
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (ledgers.length === 0 && !showCreateForm) {
      tableRows.push(
        <tr key="no-ledgers">
          <td colSpan="6" className="text-center">
            No ledgers found.
          </td>
        </tr>
      );
      return tableRows;
    }

    // Add the ledger rows
    ledgers.forEach((ledger) => {
      // Normal display with merged cells
      const usersInfo = getUsersInfo(ledger);
      const isEditingPermissions = editingPermissionsForLedgerId === ledger._id;
      const isAddingUser = addUserDropdownLedgerId === ledger._id;

      // Add an extra row for the add user dropdown if it's visible
      let rowCount = usersInfo.length;
      if (isAddingUser) {
        rowCount += 1;
      }

      // Create the content for user rows
      const userRows = usersInfo.map((user, index) => {
        return (
          <tr
            key={`${ledger._id}-user-${index}`}
            className={index > 0 ? "continuation-row" : ""}
          >
            {index === 0 ? (
              // First row has ledger name and currency with rowspan
              <>
                <td rowSpan={rowCount} className="align-middle">
                  {isEditingPermissions ? (
                    <input
                      type="text"
                      className="form-input"
                      value={editingLedgerName}
                      onChange={handleLedgerNameChange}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    ledger.name
                  )}
                </td>
                <td rowSpan={rowCount} className="align-middle">
                  {ledger.currency}
                </td>
              </>
            ) : null}

            {/* Regular user name display with Remove button when editing permissions */}
            <td className="text-left">
              {user.name}
              {isEditingPermissions && user.userId && (
                <button
                  onClick={() => handleRemoveUser(user.userId)}
                  className="btn btn-secondary"
                  style={{
                    padding: "2px 6px",
                    fontSize: "12px",
                    marginLeft: "10px",
                  }}
                >
                  Remove
                </button>
              )}
            </td>

            <td className="text-left">{user.email}</td>

            {isEditingPermissions && user.userId ? (
              // Role dropdown when editing permissions
              <td className="text-left">
                <select
                  className="form-input"
                  value={user.role}
                  onChange={(e) =>
                    handleRoleChange(user.userId, e.target.value)
                  }
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            ) : (
              // Regular role display
              <td className="text-left">
                {user.role !== "-" ? `(${user.role})` : "-"}
              </td>
            )}

            {index === 0 ? (
              <td rowSpan={rowCount} className="align-middle">
                {isEditingPermissions ? (
                  // Buttons for permission editing mode
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={() => handleAddUser(ledger._id)}
                      className="btn"
                      style={{ padding: "4px 6px", fontSize: "12px" }}
                    >
                      Add User
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      className="btn"
                      style={{ padding: "4px 6px", fontSize: "12px" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelPermissions}
                      className="btn btn-secondary"
                      style={{ padding: "4px 6px", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // Regular action buttons - Edit button removed
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={() => handleManagePermissions(ledger)}
                      className="btn"
                      style={{
                        padding: "4px 6px",
                        fontSize: "12px",
                        backgroundColor: "#17a2b8",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLedger(ledger._id)}
                      className="btn btn-secondary"
                      style={{ padding: "4px 6px", fontSize: "12px" }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            ) : null}
          </tr>
        );
      });

      // Add the "Add User" dropdown row if needed
      if (isAddingUser) {
        userRows.push(
          <tr key={`${ledger._id}-add-user`} className="continuation-row">
            <td className="text-left">
              <select
                className="form-input"
                value={newUserSelectValue}
                onChange={handleUserSelect}
                style={{ width: "100%" }}
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </td>
            <td className="text-left"></td>
            <td className="text-left">(viewer)</td>
          </tr>
        );
      }

      // Add all the user rows to the table
      tableRows.push(...userRows);
    });

    return tableRows;
  };

  return (
    <div className="ledger-management">
      <h1 className="mb-3">Ledger Management</h1>

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

      <div
        className="admin-actions"
        style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
      >
        <button className="btn" onClick={toggleCreateForm}>
          {showCreateForm ? "Cancel" : "Create New Ledger"}
        </button>
        <button
          className="btn"
          onClick={handleExportToExcel}
          disabled={exporting || ledgers.length === 0}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            cursor:
              exporting || ledgers.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {exporting ? "Exporting..." : "Export to Excel"}
        </button>
      </div>

      <div className="table-container">
        <style>
          {`
          .align-middle {
            vertical-align: middle;
          }
          .continuation-row td {
            border-top: 1px solid #dee2e6;
          }
          table.table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
          }
          table.table tr:first-child td {
            border-top: 2px solid #0056b3;
          }
          table.table tbody tr:not(.continuation-row) {
            border-top: 2px solid #0056b3;
          }
          th {
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            border-bottom: 2px solid #0056b3;
          }
          td {
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .text-left {
            text-align: left !important;
          }
          .create-form-row {
            background-color: rgba(0, 86, 179, 0.05);
          }
          `}
        </style>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "180px" }}>Ledger Name</th>
              <th style={{ width: "100px" }}>Currency</th>
              <th style={{ width: "180px" }} className="text-left">
                User
              </th>
              <th style={{ width: "220px" }} className="text-left">
                Mail Address
              </th>
              <th style={{ width: "120px" }} className="text-left">
                Role
              </th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>{renderTable()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerManagement;
