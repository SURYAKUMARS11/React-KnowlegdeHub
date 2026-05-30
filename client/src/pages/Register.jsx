import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { register } from "../services/auth";

function Register() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
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

    if (!form.name.trim()) {
      errors.name = "Name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!form.password.trim()) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!form.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
      const data = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setUser(data.user, data.token);
      showToast({ message: "Registration successful. Welcome!", tone: "success" });
      navigate("/");
    } catch (err) {
      const message = err.message || "Registration failed";
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
          <span className="eyebrow">New Workspace</span>
          <h2>Bring everyone into the same knowledge stream.</h2>
          <p className="muted">
            Invite teammates, track contributions, and surface the best work in minutes.
          </p>
          <div className="auth-visual" aria-hidden="true">
            <svg viewBox="0 0 220 140" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="authGlowRegister" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#167a72" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#ef7d3b" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect x="18" y="18" width="152" height="96" rx="18" fill="#fff" />
              <rect x="30" y="34" width="96" height="12" rx="6" fill="#f0e2d2" />
              <rect x="30" y="54" width="112" height="10" rx="5" fill="#f6eadc" />
              <rect x="30" y="72" width="104" height="10" rx="5" fill="#f6eadc" />
              <rect x="30" y="90" width="70" height="10" rx="5" fill="#f0e2d2" />
              <circle cx="176" cy="38" r="24" fill="url(#authGlowRegister)" />
              <circle cx="190" cy="92" r="16" fill="#d7f4e8" />
              <path
                d="M40 112 C78 98, 116 98, 154 118"
                stroke="#e2cbb1"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="auth-panel__stats">
            <div>
              <h3>24 hrs</h3>
              <p className="muted">Setup time saved</p>
            </div>
            <div>
              <h3>98%</h3>
              <p className="muted">Adoption rate</p>
            </div>
          </div>
        </div>
        <div className="auth-card">
          <div>
            <h2>Create account</h2>
            <p className="muted">Start organizing your team's knowledge.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
              {fieldErrors.name ? (
                <span className="form-error form-error--inline">{fieldErrors.name}</span>
              ) : null}
            </label>
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
                placeholder="Create a password"
              />
              <span className="form-hint">Use at least 8 characters.</span>
              {fieldErrors.password ? (
                <span className="form-error form-error--inline">{fieldErrors.password}</span>
              ) : null}
            </label>
            <label className="form-field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
              />
              {fieldErrors.confirmPassword ? (
                <span className="form-error form-error--inline">
                  {fieldErrors.confirmPassword}
                </span>
              ) : null}
            </label>
            <label className="form-field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
