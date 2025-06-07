// client/src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
//import { GoogleOAuthProvider } from "@react-oauth/google";

// Components
import Navbar from "./components/UI/Navbar";
import Footer from "./components/UI/Footer";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import LedgerDetails from "./components/Ledger/LedgerDetails";
import AdminDashboard from "./components/Admin/AdminDashboard";
import UserManagement from "./components/Admin/UserManagement";
import LedgerManagement from "./components/Admin/LedgerManagement";
import TransactionManagement from "./components/Admin/TransactionManagement";
import MessageManagement from "./components/Admin/MessageManagement";
// Protected route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/success" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ledger/:id"
              element={
                <ProtectedRoute>
                  <LedgerDetails />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/ledgers"
              element={
                <ProtectedRoute adminOnly={true}>
                  <LedgerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute adminOnly={true}>
                  <MessageManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute adminOnly={true}>
                  <TransactionManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
