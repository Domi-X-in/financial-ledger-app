// client/src/components/UI/Navbar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToHome = () => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <nav className="navbar">
      <img
        src={logo}
        alt="Financial Ledger Logo"
        className="navbar-logo"
        onClick={goToHome}
      />

      {isAuthenticated ? (
        <div className="navbar-links">
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          {isAdmin && (
            <Link to="/admin" className="navbar-link">
              Admin
            </Link>
          )}
          <span className="navbar-link">Welcome, {user.name}</span>
          <span
            className="navbar-link"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          >
            Logout
          </span>
        </div>
      ) : (
        <div className="navbar-links">
          <Link to="/login" className="navbar-link">
            Login
          </Link>
          <Link to="/signup" className="navbar-link">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
