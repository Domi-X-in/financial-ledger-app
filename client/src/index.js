// client/src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={
        process.env.REACT_APP_GOOGLE_CLIENT_ID ||
        "546093916646-61te4nor4o5sgmokn87anqo7ah15urbp.apps.googleusercontent.com"
      }
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
