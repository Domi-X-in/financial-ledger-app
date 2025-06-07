// client/src/components/Admin/UserManagement.js
import React, { useState, useEffect } from "react";
import { getUsers, inviteUser, updateUser, deleteUser } from "../../utils/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    role: "user",
  });
  const [inviteSuccess, setInviteSuccess] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteFormData({
      ...inviteFormData,
      [name]: value,
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    try {
      await inviteUser(inviteFormData);
      setInviteSuccess(`Invitation sent to ${inviteFormData.email}`);
      setInviteFormData({
        email: "",
        role: "user",
      });

      // Hide success message after 3 seconds
      setTimeout(() => {
        setInviteSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error inviting user:", err);
      setError("Failed to send invitation. Please try again.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });

      // Update local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      console.error(`Error updating user ${userId}:`, err);
      setError("Failed to update user role. Please try again.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);

        // Update local state
        setUsers(users.filter((user) => user._id !== userId));
      } catch (err) {
        console.error(`Error deleting user ${userId}:`, err);
        setError("Failed to delete user. Please try again.");
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <h1 className="mb-3">User Management</h1>

      {error && (
        <p className="mb-3" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}
      {inviteSuccess && (
        <p className="mb-3" style={{ color: "var(--success-color)" }}>
          {inviteSuccess}
        </p>
      )}

      <div className="admin-actions">
        <button
          className="btn"
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          {showInviteForm ? "Cancel" : "Invite New User"}
        </button>
      </div>

      {showInviteForm && (
        <div className="card mb-3">
          <h3 className="mb-2">Invite User</h3>
          <form onSubmit={handleInviteSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={inviteFormData.email}
                onChange={handleInviteChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="form-input"
                value={inviteFormData.role}
                onChange={handleInviteChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" className="btn">
              Send Invitation
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      className="form-input"
                      style={{ padding: "4px 8px" }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "14px" }}
                    >
                      Delete
                    </button>
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

export default UserManagement;
