import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { login } from "../services/auth";

function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function isValidEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  }

  function collectFieldErrors() {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!form.password.trim()) {
      errors.password = "Password is required";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const nextErrors = collectFieldErrors();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      const firstError = Object.values(nextErrors)[0];
      showToast({ message: firstError, tone: "error" });
      return;
    }

    setFieldErrors({});

    setLoading(true);

    try {
      const data = await login(form);
      setUser(data.user);
      showToast({ message: "Login successful. Welcome back!", tone: "success" });
      navigate("/");
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message);
      showToast({ message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-brand">
            <div className="auth-brand__mark">KM</div>
            <div>
              <p className="auth-brand__title">Knowledge Hub</p>
              <p className="auth-brand__subtitle">Internal knowledge space</p>
            </div>
          </div>
          <span className="eyebrow">Knowledge Management</span>
          <h2>Pick up where you left off.</h2>
          <p className="muted">
            Get straight back to dashboards, reviews, and your latest knowledge briefs.
          </p>
          <div className="auth-visual" aria-hidden="true">
            <svg viewBox="0 0 220 140" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="authGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ef7d3b" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#167a72" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect x="14" y="18" width="160" height="96" rx="16" fill="#fff" />
              <rect x="24" y="32" width="90" height="12" rx="6" fill="#f0e2d2" />
              <rect x="24" y="52" width="120" height="10" rx="5" fill="#f6eadc" />
              <rect x="24" y="70" width="110" height="10" rx="5" fill="#f6eadc" />
              <rect x="24" y="88" width="80" height="10" rx="5" fill="#f0e2d2" />
              <circle cx="176" cy="34" r="26" fill="url(#authGlow)" />
              <circle cx="188" cy="90" r="18" fill="#ffe3c4" />
              <path
                d="M40 112 C70 92, 110 92, 150 116"
                stroke="#e2cbb1"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="auth-panel__stats">
            <div>
              <h3>12k+</h3>
              <p className="muted">Articles indexed</p>
            </div>
            <div>
              <h3>8 teams</h3>
              <p className="muted">Active this week</p>
            </div>
          </div>
        </div>
        <div className="auth-card">
          <div>
            <h2>Welcome back</h2>
            <p className="muted">Sign in to continue to your knowledge hub.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
              />
              {fieldErrors.email ? (
                <span className="form-error form-error--inline">{fieldErrors.email}</span>
              ) : null}
            </label>
            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
              />
              {fieldErrors.password ? (
                <span className="form-error form-error--inline">{fieldErrors.password}</span>
              ) : null}
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
