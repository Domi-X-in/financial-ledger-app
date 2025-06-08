// client/src/components/UI/Navbar.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToHome = () => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  // Detect mobile
  const isMobile = window.innerWidth <= 600;

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
          {isMobile ? (
            <div className="navbar-user-menu-wrapper">
              <button
                className="navbar-user-btn"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-label="User menu"
              >
                {/* Generic user SVG icon */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/></svg>
              </button>
              {userMenuOpen && (
                <div className="navbar-user-dropdown">
                  <span className="navbar-user-welcome">Welcome, {user.name}</span>
                  <span
                    className="navbar-link navbar-user-logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <span className="navbar-link">Welcome, {user.name}</span>
              <span
                className="navbar-link"
                onClick={handleLogout}
                style={{ cursor: "pointer" }}
              >
                Logout
              </span>
            </>
          )}
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
