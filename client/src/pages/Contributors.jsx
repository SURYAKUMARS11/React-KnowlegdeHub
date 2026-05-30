import React, { useEffect, useState } from "react";
import { fetchContributors } from "../services/dashboard";

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString();
}

function Contributors() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadContributors() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchContributors();
        if (isMounted) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load contributors");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadContributors();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="card fade-up">
      <div className="card__header">
        <h3>Contributors</h3>
      </div>
      <div className="list">
        {loading ? (
          <p className="muted">Loading contributors...</p>
        ) : error ? (
          <p className="muted">{error}</p>
        ) : items.length === 0 ? (
          <p className="muted">No contributors found.</p>
        ) : (
          items.map((item) => (
            <div className="list__item" key={item.id}>
              <div>
                <p className="list__title">{item.name}</p>
                <p className="list__meta">{item.email}</p>
              </div>
              <div className="list__aside">
                <span className="muted">{item.articleCount} articles</span>
                <span className="muted">{formatDate(item.lastUpdated)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Contributors;
