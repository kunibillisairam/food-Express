import React, { useState } from "react";
import "./Auth.css";

function Login({ setPage }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    // Basic validation (frontend demo)
    if (username.trim() === "" || password.trim() === "") {
      setError("Please enter username and password");
      return;
    }

    // Simulate successful login
    localStorage.setItem("user", username);
    setError("");
    setPage("home");
  };

  return (
    <div className="auth">
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p
        className="auth-link"
        onClick={() => setPage("signup")}
      >
        Don’t have an account? Signup
      </p>

      <p
        className="auth-link"
        onClick={() => setPage("admin-login")}
      >
        Admin Login
      </p>

      <p
        className="auth-link"
        onClick={() => setPage("home")}
      >
        Back to Home
      </p>
    </div>
  );
}

export default Login;

