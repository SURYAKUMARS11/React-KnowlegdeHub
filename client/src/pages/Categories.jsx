import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategories } from "../services/dashboard";

function Categories() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchCategories();
        if (isMounted) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load categories");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleCategoryClick(categoryName) {
    navigate(`/articles?category=${encodeURIComponent(categoryName)}`);
  }

  return (
    <section className="card fade-up">
      <div className="card__header">
        <h3>Categories</h3>
      </div>
      <div className="list">
        {loading ? (
          <p className="muted">Loading categories...</p>
        ) : error ? (
          <p className="muted">{error}</p>
        ) : items.length === 0 ? (
          <p className="muted">No categories found.</p>
        ) : (
          items.map((item) => (
            <div 
              className="list__item list__item--clickable" 
              key={item.name}
              onClick={() => handleCategoryClick(item.name)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCategoryClick(item.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View articles in ${item.name} category`}
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

export default Categories;
