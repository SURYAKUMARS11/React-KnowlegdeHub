import React, { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate } from "react-router-dom";
import { fetchArticles } from "../services/articles";
import { fetchActivity, fetchStats } from "../services/dashboard";

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString();
}

function extractPlainText(htmlContent) {
  if (!htmlContent) {
    return "";
  }

  // Create a temporary element to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;
  
  // Get text content and clean up whitespace
  const text = temp.textContent || temp.innerText || "";
  return text.replace(/\s+/g, " ").trim();
}

function formatRelative(value) {
  if (!value) {
    return "";
  }

  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ articles: 0, authors: 0, tags: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const data = await fetchStats();
        if (isMounted) {
          setStats({
            articles: data.articles || 0,
            authors: data.authors || 0,
            tags: data.tags || 0,
          });
        }
      } catch (error) {
        if (isMounted) {
          setStatsError(error.message || "Failed to load stats");
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      setActivityLoading(true);
      setActivityError("");

      try {
        const data = await fetchActivity();
        if (isMounted) {
          setActivity(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        if (isMounted) {
          setActivityError(error.message || "Failed to load activity");
        }
      } finally {
        if (isMounted) {
          setActivityLoading(false);
        }
      }
    }

    loadActivity();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadArticles() {
      setArticlesLoading(true);
      setArticlesError("");

      try {
        const data = await fetchArticles();
        if (isMounted) {
          // show only the most recent two articles on the overview
          setArticles(Array.isArray(data.items) ? data.items.slice(0, 2) : []);
        }
      } catch (error) {
        if (isMounted) {
          setArticlesError(error.message || "Failed to load articles");
        }
      } finally {
        if (isMounted) {
          setArticlesLoading(false);
        }
      }
    }

    loadArticles();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section className="hero card fade-up">
        <div>
          <p className="eyebrow">Knowledge at speed</p>
          <h2>Keep critical expertise searchable, current, and shared.</h2>
          <p className="muted">
            Build a single source of truth with Markdown articles, smart tags, and
            admin controls for user access.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => navigate("/articles")}> 
              <Icon name="plus" size={16} className="icon--inline" /> Create Article
            </button>
            <button className="btn btn--ghost" onClick={() => navigate("/articles")}>
              <Icon name="view" size={16} className="icon--inline" /> View Articles
            </button>
          </div>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <h3>{statsLoading ? "..." : stats.articles}</h3>
            <p>Articles</p>
          </div>
          <div className="stat">
            <h3>{statsLoading ? "..." : stats.authors}</h3>
            <p>Authors</p>
          </div>
          <div className="stat">
            <h3>{statsLoading ? "..." : stats.tags}</h3>
            <p>Active tags</p>
          </div>
        </div>
        {statsError ? <p className="muted">{statsError}</p> : null}
      </section>

      <section className="grid overview-grid">
        <div className="card fade-up overview-card overview-card--latest">
          <div className="card__header">
            <h3><Icon name="article" size={18} className="icon--inline" /> Latest Articles</h3>
            <button className="btn btn--ghost btn--small" onClick={() => navigate("/articles")}>
              View all
            </button>
          </div>
          <div className="list">
            {articlesLoading ? (
              <p className="muted">Loading articles...</p>
            ) : articlesError ? (
              <p className="muted">{articlesError}</p>
            ) : articles.length === 0 ? (
              <p className="muted">No articles yet.</p>
            ) : (
              articles.map((article) => (
                <article className="list__item" key={article._id || article.id}>
                  <div>
                    <Link
                      className="list__title list__title-link"
                      to={`/articles/${article._id || article.id}`}
                    >
                      {article.title}
                    </Link>
                    <p className="list__meta">
                      {article.excerpt || extractPlainText(article.content)?.slice(0, 120) || ""}
                    </p>
                    <div className="badges">
                      {article.category ? (
                        <span className="badge">{article.category}</span>
                      ) : null}
                      {(article.tags || []).slice(0, 3).map((tag) => (
                        <span className="badge badge--ghost" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="list__aside">
                    <span className="muted">{formatDate(article.updatedAt)}</span>
                    <span className="avatar">{article.author?.name?.[0] || "?"}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="card fade-up overview-card overview-card--activity">
          <div className="card__header">
            <h3><Icon name="activity" size={18} className="icon--inline" /> Activity Feed</h3>
            <button className="btn btn--ghost btn--small">All updates</button>
          </div>
          <div className="timeline">
            {activityLoading ? (
              <p className="muted">Loading activity...</p>
            ) : activityError ? (
              <p className="muted">{activityError}</p>
            ) : activity.length === 0 ? (
              <p className="muted">No recent activity.</p>
            ) : (
              activity.map((item) => (
                <div className="timeline__item" key={item.id}>
                  <div className="timeline__dot" />
                  <div>
                    <p className="list__title">{item.title}</p>
                    <p className="list__meta">{item.detail}</p>
                  </div>
                  <span className="muted">
                    {item.updatedAt ? formatRelative(item.updatedAt) : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default Overview;
