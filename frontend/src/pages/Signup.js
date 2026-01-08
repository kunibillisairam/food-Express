import React, { useState } from "react";
import "./Signup.css";

function Signup({ setPage }) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!username || !phone || !password) {
      alert("Please fill all fields");
      return;
    }

    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone, password }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) setPage("login");
  };

  return (
    <div className="signup-bg">
      <div className="signup-card">
        <h1 className="brand">🍽️ Royal Feast</h1>
        <p className="subtitle">Create your account</p>

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
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <label>Phone Number</label>
        </div>

        <div className="input-group">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Create Password</label>
        </div>

        <button className="signup-btn" onClick={handleSignup}>
          Create Account
        </button>

        <p className="login-link">
          Already have an account?
          <span onClick={() => setPage("login")}> Login</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
