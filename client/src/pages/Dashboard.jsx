import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchArticleMeta } from "../services/articles";
import { fetchUsers } from "../services/users";
import { ThemeToggle } from "../components/ThemeToggle";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const isUsersPage = location.pathname === "/users";
  const [meta, setMeta] = useState({ categories: [], tags: [] });
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const refreshMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError("");

    try {
      const data = await fetchArticleMeta();
      setMeta({
        categories: Array.isArray(data.categories) ? data.categories : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    } catch (error) {
      setMetaError(error.message || "Failed to load filters");
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      if (!isAdmin) {
        setUsers([]);
        setUsersLoading(false);
        setUsersError("");
        return;
      }

      setUsersLoading(true);
      setUsersError("");

      try {
        const data = await fetchUsers();
        if (!isMounted) {
          return;
        }

        setUsers(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if (isMounted) {
          setUsersError(error.message || "Failed to load users");
          setUsers([]);
        }
      } finally {
        if (isMounted) {
          setUsersLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const insightRows = useMemo(() => {
    if (!meta.categories.length) {
      return [];
    }

    const rows = meta.categories.slice(0, 3);
    const maxCount = Math.max(...rows.map((row) => row.count || 0), 1);
    return rows.map((row) => ({
      ...row,
      percent: Math.round((row.count / maxCount) * 100),
    }));
  }, [meta.categories]);

  return (
    <div className="app">
      <div className="bg-orb bg-orb--one" />
      <div className="bg-orb bg-orb--two" />
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">K</span>
          <div>
            <h1 className="brand__title">Knowledge Hub</h1>
            <p className="brand__subtitle">Curate. Share. Search.</p>
          </div>
        </div>
        <div className="topbar__actions">
          <ThemeToggle />
          {user ? (
            <>
              <span className="user-chip">Hi, {user.name}</span>
              <button className="btn btn--ghost" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--ghost" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="btn btn--primary" onClick={() => navigate("/register")}>
                Sign up
              </button>
            </>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar card">
          <div className="sidebar__section">
            <h2>Workspace</h2>
            <nav className="nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav__item ${isActive ? "nav__item--active" : ""}`
                }
              >
                Overview
              </NavLink>
              <NavLink
                to="/articles"
                className={({ isActive }) =>
                  `nav__item ${isActive ? "nav__item--active" : ""}`
                }
              >
                Articles
              </NavLink>
              <NavLink
                to="/categories"
                className={({ isActive }) =>
                  `nav__item ${isActive ? "nav__item--active" : ""}`
                }
              >
                Categories
              </NavLink>
              <NavLink
                to="/tags"
                className={({ isActive }) =>
                  `nav__item ${isActive ? "nav__item--active" : ""}`
                }
              >
                Tags
              </NavLink>
              <NavLink
                to="/contributors"
                className={({ isActive }) =>
                  `nav__item ${isActive ? "nav__item--active" : ""}`
                }
              >
                Contributors
              </NavLink>
              {isAdmin ? (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `nav__item ${isActive ? "nav__item--active" : ""}`
                  }
                >
                  Users
                </NavLink>
              ) : null}
            </nav>
          </div>
          {!user ? (
            <div className="sidebar__section">
              <h2>Access</h2>
              <button className="btn btn--full" onClick={() => navigate("/login")}>
                Sign in
              </button>
              <button
                className="btn btn--ghost btn--full"
                onClick={() => navigate("/register")}
              >
                Create account
              </button>
            </div>
          ) : null}
        </aside>

        <main className="content">
          <Outlet
            context={{
              meta,
              metaLoading,
              metaError,
              refreshMeta,
            }}
          />
        </main>

        <aside className="panel">
          {isAdmin && !isUsersPage ? (
            <section className="card fade-up">
              <div className="card__header">
                <h3>Admin Dashboard</h3>
                <span className="pill">{users.length} users</span>
              </div>
              <div className="list">
                {usersLoading ? (
                  <p className="muted">Loading users...</p>
                ) : usersError ? (
                  <p className="muted">{usersError}</p>
                ) : users.length === 0 ? (
                  <p className="muted">No users available.</p>
                ) : (
                  users.slice(0, 3).map((listUser) => (
                    <div className="list__item" key={listUser._id || listUser.id}>
                      <div>
                        <p className="list__title">{listUser.name}</p>
                        <p className="list__meta">{listUser.role}</p>
                      </div>
                      <span
                        className={`status status--${
                          listUser.isActive === false ? "warn" : "good"
                        }`}
                      >
                        {listUser.isActive === false ? "paused" : "active"}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                className="btn btn--ghost btn--full"
                onClick={() => navigate("/users")}
              >
                Manage users
              </button>
            </section>
          ) : null}

          <section className="card fade-up">
            <h3>Search Insights</h3>
            <p className="muted">
              Popular categories this week highlight what your team is reading most.
            </p>
            <div className="progress">
              {metaLoading ? (
                <p className="muted">Loading insights...</p>
              ) : metaError ? (
                <p className="muted">{metaError}</p>
              ) : insightRows.length === 0 ? (
                <p className="muted">No insights available.</p>
              ) : (
                insightRows.map((row) => (
                  <div key={row.name}>
                    <span>{row.name}</span>
                    <div className="progress__bar">
                      <span style={{ width: `${row.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default DashboardLayout;
