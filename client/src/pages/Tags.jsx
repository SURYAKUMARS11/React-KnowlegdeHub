import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTags } from "../services/dashboard";

function Tags() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTags() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchTags();
        if (isMounted) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load tags");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTags();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleTagClick(tagName) {
    navigate(`/articles?tag=${encodeURIComponent(tagName)}`);
  }

  return (
    <section className="card fade-up">
      <div className="card__header">
        <h3>Tags</h3>
      </div>
      <div className="list">
        {loading ? (
          <p className="muted">Loading tags...</p>
        ) : error ? (
          <p className="muted">{error}</p>
        ) : items.length === 0 ? (
          <p className="muted">No tags found.</p>
        ) : (
          items.map((item) => (
            <div 
              className="list__item list__item--clickable" 
              key={item.name}
              onClick={() => handleTagClick(item.name)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleTagClick(item.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View articles with ${item.name} tag`}
            >
              <div>
                <p className="list__title">{item.name}</p>
                <p className="list__meta">{item.count} articles</p>
              </div>
              <span className="pill">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Tags;
