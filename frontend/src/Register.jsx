import React from "react";
import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Register Your College 🏫</h2>
        <p className="register-subtitle">
          Join <b>EduPredict</b> and empower your institution with AI insights!
        </p>

        <form className="register-form">
          <div className="input-group">
            <input type="text" placeholder="College Name" required />
          </div>
          <div className="input-group">
            <input type="email" placeholder="College Email" required />
          </div>
          <div className="input-group">
            <input type="text" placeholder="Username" required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="Password" required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="Confirm Password" required />
          </div>

          <button type="submit" className="register-btn">
            Register
          </button>
        </form>

        <p className="login-text">
          Already registered? <Link to="/login">Login here</Link>
        </p>

        <Link to="/" className="back-home">← Back to Home</Link>
      </div>
    </div>
  );
}

export default Register;
