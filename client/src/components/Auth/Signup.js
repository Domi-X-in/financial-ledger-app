// client/src/components/Auth/Signup.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
// Google OAuth
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register, googleLogin, devUserLogin, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await register(name, email, password);
      // Navigation is handled by the useEffect above
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to register"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        setError("");
        console.log("Google login success:", response);

        // Send the access token to our backend
        await googleLogin(response.access_token);

        // Navigation is handled by the useEffect above
      } catch (err) {
        console.error("Google login error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to login with Google"
        );
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Sign-In Error:", error);
      setError("Google Sign-In failed. Please try again later.");
      setIsLoading(false);
    },
    flow: "implicit", // Ensure we get tokens directly
    prompt: "select_account", // Show account selection screen
  });

  return (
    <div className="auth-container">
      <img src={logo} alt="Financial Ledger Logo" className="auth-logo" />

      <div className="card">
        <h2 className="auth-title">Create your account</h2>

        {error && (
          <p className="mb-2" style={{ color: "var(--error-color)" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mb-3">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

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
              required
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
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn w-100" disabled={isLoading}>
            {isLoading ? "Processing..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center mb-3">
          <p className="mb-2">OR</p>
          <button
            onClick={() => googleLoginHandler()}
            className="btn"
            style={{
              backgroundColor: "#4285F4",
              color: "white",
              width: "100%",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Sign up with Google"}
          </button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="text-center mb-3">
            <p className="mb-2">Development Options:</p>
            <button
              onClick={() => devUserLogin()}
              className="btn"
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                width: "100%",
              }}
              disabled={isLoading}
            >
              Sign in as User (Dev)
            </button>
          </div>
        )}

        <p className="auth-message">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
