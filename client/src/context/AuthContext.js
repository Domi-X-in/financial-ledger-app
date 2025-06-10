import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import config from "../config";

// Create axios instance with base URL
const api = axios.create({
  baseURL: config.apiUrl
});

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Set up axios default headers whenever token changes
  useEffect(() => {
    if (token) {
      console.log("Setting axios default auth header with token");
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      console.log("Removing axios default auth header");
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          console.log(
            "Loading user with token",
            token.substring(0, 20) + "..."
          );

          // Set axios defaults for all requests
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Check if we already have user data from login/googleLogin
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log("Using stored user data:", parsedUser);
            setUser(parsedUser);
            setLoading(false);
            return;
          }

          // Otherwise fetch from API
          const res = await api.get("/api/auth/current");
          console.log("User data loaded:", res.data);
          setUser(res.data);

          // Store user data in localStorage for role checks in API calls
          localStorage.setItem("user", JSON.stringify(res.data));
        } catch (err) {
          console.error("Error loading user:", err);
          console.error("Response status:", err.response?.status);
          console.error("Response data:", err.response?.data);

          // Only clear token if it's a 401 error (unauthorized)
          if (err.response?.status === 401) {
            console.log("Clearing invalid token");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Regular login function
  const login = async (email, password) => {
    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });
      console.log(
        "Login successful, token received:",
        res.data.token.substring(0, 20) + "..."
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Google login function
  const googleLogin = async (googleToken) => {
    try {
      console.log("Sending Google token to backend...");
      const res = await api.post("/api/auth/google", { token: googleToken });
      console.log("Response from backend:", res.data);

      if (!res.data.token) {
        console.error("No token received from backend");
        throw new Error("No token received from backend");
      }

      // Store the JWT token from your backend
      console.log("Storing token:", res.data.token.substring(0, 20) + "...");
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);

      // Immediately set user data to avoid an extra API call
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      return res.data;
    } catch (error) {
      console.error("Google login error:", error.response?.data || error);
      throw error;
    }
  };

  // User registration
  const register = async (name, email, password) => {
    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    // Clear axios auth header
    delete api.defaults.headers.common["Authorization"];
  };

  // Development login function for testing without Google OAuth
  const devLogin = async () => {
    try {
      const response = await api.post("/api/auth/dev-login");
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch (err) {
      console.error("Development login error:", err);
      throw err;
    }
  };

  // Development login for a regular user
  const devUserLogin = async () => {
    try {
      const response = await api.post("/api/auth/dev-user-login");
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch (err) {
      console.error("Development user login error:", err);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    googleLogin,
    register,
    logout,
    devLogin: process.env.NODE_ENV !== "production" ? devLogin : undefined,
    devUserLogin: process.env.NODE_ENV !== "production" ? devUserLogin : undefined,
    isAuthenticated: !!user,
    isAdmin: user && user.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
