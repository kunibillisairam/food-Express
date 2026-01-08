import React, { useState } from "react";
import "./AdminLogin.css";

function AdminLogin({ setPage }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "admin123") {
  localStorage.setItem("admin", "true");
  setPage("admin");
} else {
  alert("Invalid admin credentials");
}
if (username === "admin" && password === "admin123") {
  localStorage.setItem("admin", "true");
  setPage("admin");
} else {
  alert("Invalid admin credentials");
}

  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <h1 className="restaurant-name">🍽️ Royal Feast</h1>
        <p className="subtitle">Admin Login</p>

        <div className="input-group">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Username</label>
        </div>

        <div className="input-group">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Password</label>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        <button
          className="back-btn"
          onClick={() => setPage("home")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
