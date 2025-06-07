import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import axios from "axios";

const Login = () => {
  const {
    login,
    devLogin,
    devUserLogin,
    isAuthenticated,
    googleLogin: authGoogleLogin,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google login hook with simplified parameters
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        console.log("Google login success! Access token received");
        console.log("Access token:", tokenResponse.access_token);

        // Use the googleLogin function from AuthContext
        await authGoogleLogin(tokenResponse.access_token);
        console.log("Google login successful");

        // Navigation will be handled by useEffect that checks isAuthenticated
      } catch (error) {
        console.error("Google login error:", error);
        setError(
          "Failed to authenticate: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
      setError("Google authentication failed: " + error.message);
      setIsLoading(false);
    },
    flow: "implicit",
    prompt: "select_account",
    ux_mode: "popup",
  });

  // Test function to verify backend connectivity
  const testBackendConnection = () => {
    setIsLoading(true);
    console.log("Testing backend connection...");
    axios
      .post("/api/auth/google-test", { test: true })
      .then((response) => {
        console.log("Backend connection successful:", response.data);
        setError("Backend connection successful"); // This will show in the UI
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
        setError("Backend connection failed: " + error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    // Check if redirected from Google OAuth
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const authError = params.get("error");

    if (token) {
      console.log("Token found in URL, logging in...");
      login(token);
      navigate("/dashboard");
    }

    if (authError) {
      console.error("Auth error found in URL:", authError);
      setError("Authentication failed. Please try again.");
    }
  }, [location, login, navigate]);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      console.log("User already authenticated, redirecting to dashboard...");
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    console.log("Form submit - using dev login");
    devLogin();
    navigate("/dashboard");
  };

  const handleGoogleLogin = () => {
    console.log("Starting Google login flow...");
    googleLogin();
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="Financial Ledger Logo" className="auth-logo" />

      <div className="card">
        <h2 className="auth-title">Log in to your account</h2>

        {error && (
          <p className="mb-2" style={{ color: "var(--error-color)" }}>
            {error}
          </p>
        )}

        {/* Development Login Form */}
        <form onSubmit={handleSubmit} className="mb-3">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn w-100" disabled={isLoading}>
            {isLoading ? "Processing..." : "Log in"}
          </button>
        </form>

        <div className="text-center mb-3">
          <p className="mb-2">OR</p>
          <button
            onClick={handleGoogleLogin}
            className="btn"
            style={{
              backgroundColor: "#4285F4",
              color: "white",
              width: "100%",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Sign in with Google"}
          </button>
        </div>

        <div className="text-center mb-3">
          <p className="mb-2">Development Options:</p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={() => devLogin()}
                className="btn"
                style={{ backgroundColor: "#6c757d", color: "white" }}
                disabled={isLoading}
              >
                Sign in as Admin (Dev)
              </button>

              <button
                onClick={() => devUserLogin()}
                className="btn"
                style={{ backgroundColor: "#6c757d", color: "white" }}
                disabled={isLoading}
              >
                Sign in as User (Dev)
              </button>
            </div>

            <button
              onClick={testBackendConnection}
              className="btn"
              style={{ backgroundColor: "#28a745", color: "white" }}
              disabled={isLoading}
            >
              Test Backend Connection
            </button>
          </div>
        </div>

        <p className="auth-message">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>

      <div className="card mt-3">
        <h3 className="mb-2">Financial Ledger App</h3>
        <p>
          A comprehensive solution for tracking your financial transactions
          between ledger accounts.
        </p>
        <ul className="mt-2">
          <li>Track loans, payments, and deposits</li>
          <li>View running balances over time</li>
          <li>Visualize your financial data with charts</li>
          <li>Secure and easy to use</li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
