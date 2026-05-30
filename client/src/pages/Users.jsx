import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { deactivateUser, fetchUsers, updateUserRole, activateUser } from "../services/users";

const ROLE_OPTIONS = ["admin", "user"];

function Users() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      if (!isAdmin) {
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchUsers();
        if (isMounted) {
          setUsers(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load users");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((listUser) => {
      const matchesQuery = normalizedQuery
        ? `${listUser.name || ""} ${listUser.email || ""}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesRole = roleFilter === "all" ? true : listUser.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  async function handleRoleChange(listUser, nextRole) {
    if (listUser.role === nextRole) {
      return;
    }

    try {
      const data = await updateUserRole(listUser._id || listUser.id, nextRole);
      const updated = data.item;
      setUsers((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      showToast({ message: `Role updated to ${nextRole}.`, tone: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to update role", tone: "error" });
    }
  }

  async function handleDeactivate(listUser) {
    if (listUser.isActive === false) {
      return;
    }

    try {
      const data = await deactivateUser(listUser._id || listUser.id);
      const updated = data.item;
      setUsers((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      showToast({ message: "User deactivated.", tone: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to deactivate user", tone: "error" });
    }
  }

  async function handleActivate(listUser) {
    if (listUser.isActive === true) {
      return;
    }

    try {
      const data = await activateUser(listUser._id || listUser.id);
      const updated = data.item;
      setUsers((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      showToast({ message: "User activated.", tone: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to activate user", tone: "error" });
    }
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card fade-up">
      <div className="card__header">
        <div>
          <h3>User Management</h3>
          <p className="muted">Search, filter, and manage access across the workspace.</p>
        </div>
        <span className="pill">{users.length} total</span>
      </div>

      <div className="user-toolbar">
        <label className="user-search">
          <span className="muted">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
          />
        </label>
        <label className="user-filter">
          <span className="muted">Role</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <div className="user-count muted">{filteredUsers.length} shown</div>
      </div>

      <div className="user-list">
        {loading ? (
          <p className="muted">Loading users...</p>
        ) : error ? (
          <p className="muted">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="muted">No users match your filters.</p>
        ) : (
          filteredUsers.map((listUser) => (
            <div className="user-row" key={listUser._id || listUser.id}>
              <div className="user-info">
                <span className="avatar">
                  {listUser.name ? listUser.name[0].toUpperCase() : "?"}
                </span>
                <div>
                  <p className="list__title">{listUser.name}</p>
                  <p className="list__meta">{listUser.email}</p>
                </div>
              </div>
              <div className="user-meta">
                <span className="user-role-text">{listUser.role}</span>
                <span
                  className={`status status--${
                    listUser.isActive === false ? "warn" : "good"
                  }`}
                >
                  {listUser.isActive === false ? "paused" : "active"}
                </span>
              </div>
              <div className="user-actions">
                {listUser.isActive === false ? (
                  <button
                    className="btn btn--ghost btn--small"
                    type="button"
                    onClick={() => handleActivate(listUser)}
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    className="btn btn--ghost btn--small"
                    type="button"
                    onClick={() => handleDeactivate(listUser)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Users;
