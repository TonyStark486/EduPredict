import React from "react";
import { Link } from "react-router-dom";
import "./Login.css"; // External CSS for styling

function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Welcome Back 👋</h2>
        <p className="login-subtitle">Login to continue to <b>EduPredict</b></p>

        <form className="login-form">
          <div className="input-group">
            <input type="text" placeholder="Username or Email" required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="Password" required />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>

        <p className="register-text">
          New here? <Link to="/register">Register your college</Link>
        </p>

        <Link to="/" className="back-home">← Back to Home</Link>
      </div>
    </div>
  );
}

export default Login;
