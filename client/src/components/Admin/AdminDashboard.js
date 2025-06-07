// client/src/components/Admin/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsers, getLedgers, getMessages } from "../../utils/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    ledgers: 0,
    messages: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, ledgers, messages] = await Promise.all([
          getUsers(),
          getLedgers(),
          getMessages(),
        ]);

        setStats({
          users: users.length,
          ledgers: ledgers.length,
          messages: messages.length,
          unreadMessages: messages.filter((m) => !m.isRead).length,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError("Failed to load admin statistics. Please try again.");
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleCreateLedger = () => {
    navigate("/admin/ledgers", { state: { showCreateForm: true } });
  };

  const handleAddTransaction = () => {
    navigate("/admin/transactions");
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1 className="mb-3">Admin Dashboard</h1>

      {error && (
        <p className="mb-3" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Users</h3>
          <div className="admin-card-value">{stats.users}</div>
          <Link to="/admin/users" className="btn">
            Manage Users
          </Link>
        </div>

        <div className="admin-card">
          <h3>Ledgers</h3>
          <div className="admin-card-value">{stats.ledgers}</div>
          <Link to="/admin/ledgers" className="btn">
            Manage Ledgers
          </Link>
        </div>

        <div className="admin-card">
          <h3>Transactions</h3>
          <div className="admin-card-value">-</div>
          <Link to="/admin/transactions" className="btn">
            Manage Transactions
          </Link>
        </div>

        <div className="admin-card">
          <h3>Messages</h3>
          <div className="admin-card-value">{stats.messages}</div>
          <p className="mb-2">Unread: {stats.unreadMessages}</p>
          <Link to="/admin/messages" className="btn">
            View Messages
          </Link>
        </div>
      </div>

      <div className="card mt-3">
        <h2 className="mb-2">Quick Actions</h2>
        <div className="grid grid-3">
          <Link to="/admin/users" className="btn">
            Invite New User
          </Link>
          <button onClick={handleCreateLedger} className="btn">
            Create New Ledger
          </button>
          <button onClick={handleAddTransaction} className="btn">
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
