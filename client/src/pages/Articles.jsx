import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { marked } from "marked";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { shareArticle, downloadArticleAsPDF } from "../utils/articleUtils";
import "../styles/articles-improvements.css";
import { Comments } from "../components/Comments";
import Icon from "../components/Icon";
import {
  createArticle,
  fetchArticles,
  fetchArticle,
  searchArticles,
  updateArticle,
  deleteArticle,
  toggleBookmark,
  getRelatedArticles,
  saveDraft,
  publishDraft,
  getDrafts,
  incrementViewCount,
} from "../services/articles";

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

function Articles() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const { meta, metaLoading, metaError, refreshMeta } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState("");
  const [page, setPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const limit = 4;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "");
  const [editor, setEditor] = useState({
    title: "",
    category: "",
    tags: "",
    content: "",
  });
  const [showEditor, setShowEditor] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const editorContentRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const quillRefModal = useRef(null);
  const quillRefNew = useRef(null);
  const modalEditFormRef = useRef(null);
  const isInitializingModalRef = useRef(false);
  const programmaticUpdateRef = useRef(false);
  const changeTimeoutRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    tags: "",
    content: "",
  });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [modalEditForm, setModalEditForm] = useState({
    title: "",
    category: "",
    tags: "",
    content: "",
  });
  const [modalEditLoading, setModalEditLoading] = useState(false);
  const [modalEditError, setModalEditError] = useState("");
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const activeIdRef = useRef(null);

  const canEdit = useMemo(() => {
    if (!user) {
      return () => false;
    }

    return (article) => {
      if (user.role === "admin") {
        return true;
      }

      const authorId = article?.author?._id || article?.author?.id || article?.author;
      return authorId && String(authorId) === String(user.id);
    };
  }, [user]);

  async function loadArticles() {
    setArticlesLoading(true);
    setArticlesError("");

    try {
      const hasFilters = Boolean(searchQuery || selectedCategory || selectedTag);
      const data = hasFilters
        ? await searchArticles({
            query: searchQuery,
            category: selectedCategory,
            tag: selectedTag,
          }, page, limit)
        : await fetchArticles(page, limit);
      
      setArticles(Array.isArray(data.items) ? data.items : []);
      setTotalArticles(data.total || 0);
    } catch (error) {
      setArticlesError(error.message || "Failed to load articles");
      setArticles([]);
      setTotalArticles(0);
    } finally {
      setArticlesLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      loadArticles();
    }, 350);

    return () => clearTimeout(handle);
  }, [searchQuery, selectedCategory, selectedTag, page]);

  const isOverlayOpen = modalOpen || showEditor;

  useEffect(() => {
    if (!isOverlayOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setModalOpen(false);
        setShowEditor(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverlayOpen]);

  // Setup paste handler for Quill modal editor
  useEffect(() => {
    if (!quillRefModal.current || !modalOpen || !modalEditMode) {
      return undefined;
    }

    const editor = quillRefModal.current.getEditor();
    let pasteTimeout;

    const handlePaste = () => {
      // After paste completes, sync Quill's content with React state
      clearTimeout(pasteTimeout);
      pasteTimeout = setTimeout(() => {
        const html = editor.root.innerHTML;
        if (html && html !== '<p><br></p>') {
          // Update state with the actual content from Quill
          setModalEditForm((prev) => ({ ...prev, content: html }));
        }
      }, 50);
    };

    editor.root.addEventListener("paste", handlePaste);

    return () => {
      editor.root.removeEventListener("paste", handlePaste);
      clearTimeout(pasteTimeout);
    };
  }, [modalOpen]);

  function handleEditorChange(event) {
    const { name, value } = event.target;
    setEditor((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePublish(event) {
    event.preventDefault();
    setEditorError("");

    if (!user) {
      setEditorError("Please sign in to publish an article.");
      return;
    }

    if (!editor.title || !editor.content || !editor.category) {
      setEditorError("Title, category, and content are required.");
      return;
    }

    setEditorLoading(true);
    try {
      await createArticle(
        {
          title: editor.title,
          content: editor.content,
          category: editor.category,
          tags: editor.tags,
        },
      );

      setEditor({ title: "", category: "", tags: "", content: "" });
      await Promise.all([loadArticles(), refreshMeta()]);
      setShowEditor(false);
    } catch (error) {
      setEditorError(error.message || "Failed to publish article");
    } finally {
      setEditorLoading(false);
    }
  }

  function normalizePastedText(value) {
    const lines = value.replace(/\r\n/g, "\n").split("\n");
    const trimmed = lines.map((line) => line.replace(/^\s+/, ""));
    return trimmed.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function insertAtCursor(target, nextValue) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    return `${target.value.slice(0, start)}${nextValue}${target.value.slice(end)}`;
  }

  function handleEditorPaste(event) {
    const clipboardHTML = event.clipboardData?.getData("text/html");
    const clipboardText = event.clipboardData?.getData("text/plain");
    const pasteContent = clipboardHTML || clipboardText;
    
    if (!pasteContent || !editorContentRef.current) {
      return;
    }

    event.preventDefault();
    
    if (clipboardHTML) {
      // For HTML content, preserve as-is (markdown will handle HTML)
      const start = editorContentRef.current.selectionStart;
      const end = editorContentRef.current.selectionEnd;
      const before = editorContentRef.current.value.slice(0, start);
      const after = editorContentRef.current.value.slice(end);
      const nextContent = `${before}${clipboardHTML}${after}`;
      setEditor((prev) => ({ ...prev, content: nextContent }));
    } else {
      // For plain text, normalize whitespace
      const normalized = normalizePastedText(clipboardText);
      const nextContent = insertAtCursor(editorContentRef.current, normalized);
      setEditor((prev) => ({ ...prev, content: nextContent }));
    }
  }

  function handleImageUpload(quillRef, isModal = false) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file || !quillRef.current) return;

      try {
        // Convert image to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Image = e.target?.result;
          if (!base64Image) return;

          const quill = quillRef.current?.getEditor?.();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, "image", base64Image);
              quill.setSelection(range.index + 1);
            }
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        showToast({ message: "Failed to upload image", tone: "error" });
      }
    };
  }

  function handleVideoUpload(quillRef) {
    // For video, we'll use embeds (YouTube, Vimeo, etc.)
    const url = window.prompt("Enter video URL (YouTube, Vimeo, etc.)", "");
    if (!url || !quillRef.current) return;

    try {
      const quill = quillRef.current?.getEditor?.();
      if (quill) {
        const range = quill.getSelection();
        if (range) {
          quill.insertEmbed(range.index, "video", url);
          quill.setSelection(range.index + 1);
        }
      }
    } catch (error) {
      showToast({ message: "Failed to insert video", tone: "error" });
    }
  }

  function startEdit(article) {
    setEditingId(article._id || article.id);
    setEditForm({
      title: article.title || "",
      category: article.category || "",
      tags: Array.isArray(article.tags) ? article.tags.join(", ") : article.tags || "",
      content: article.content || "",
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
    setEditLoading(false);
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSave(event) {
    event.preventDefault();
    setEditError("");

    if (!user) {
      setEditError("Please sign in to edit an article.");
      return;
    }

    if (!editForm.title || !editForm.content || !editForm.category) {
      setEditError("Title, category, and content are required.");
      return;
    }

    setEditLoading(true);
    try {
      await updateArticle(
        editingId,
        {
          title: editForm.title,
          content: editForm.content,
          category: editForm.category,
          tags: editForm.tags,
        },
      );
      setEditingId(null);
      await Promise.all([loadArticles(), refreshMeta()]);
    } catch (error) {
      setEditError(error.message || "Failed to update article");
    } finally {
      setEditLoading(false);
    }
  }

  async function openArticle(article) {
    const id = article?._id || article?.id;
    if (!id) {
      return;
    }

    setActiveId(id);
    activeIdRef.current = id;
    setActiveArticle(article);
    setDetailError("");
    setDetailLoading(true);
    setModalOpen(true);
    setModalEditMode(false);

    try {
      const data = await fetchArticle(id);
      if (activeIdRef.current === id) {
        setActiveArticle(data.item || article);
        
        // Increment view count
        await incrementViewCount(id);
        
        // Load related articles
        loadRelatedArticles();
        
        // Check if bookmarked
        setIsBookmarked(data.item?.bookmarkedBy?.includes(user?.id) || false);
      }
    } catch (error) {
      if (activeIdRef.current === id) {
        setDetailError(error.message || "Failed to load article");
      }
    } finally {
      if (activeIdRef.current === id) {
        setDetailLoading(false);
      }
    }
  }

  function startModalEdit(article) {
    isInitializingModalRef.current = true;
    setModalEditMode(true);
    const newForm = {
      title: article.title || "",
      category: article.category || "",
      tags: Array.isArray(article.tags) ? article.tags.join(", ") : article.tags || "",
      content: article.content || "",
    };
    modalEditFormRef.current = { ...newForm, hasStartedEditing: false };
    setModalEditForm(newForm);
    console.log("[Debug] startModalEdit -> newForm content length:", (newForm.content || "").length);
    setModalEditError("");

    // Programmatically initialize the Quill editor content once it's mounted
    setTimeout(() => {
      try {
        const editor = quillRefModal.current?.getEditor?.();
        if (editor) {
          programmaticUpdateRef.current = true;
          // Use clipboard conversion to preserve HTML if present
          const html = newForm.content || "";
          console.log("[Debug] initializing Quill, programmaticUpdateRef set -> true");
          if (html) {
            editor.root.innerHTML = html;
            console.log("[Debug] editor.root.innerHTML set, length:", editor.root.innerHTML.length);
          } else {
            editor.setContents([{ insert: '' }]);
            console.log("[Debug] editor.setContents called (empty)");
          }

          // small delay to let Quill settle and avoid firing user onChange
          setTimeout(() => {
            programmaticUpdateRef.current = false;
            isInitializingModalRef.current = false;
            console.log("[Debug] programmaticUpdateRef cleared, isInitializingModalRef cleared");
          }, 50);
        } else {
          isInitializingModalRef.current = false;
          console.log("[Debug] editor not available during init");
        }
      } catch (e) {
        console.error('Failed to initialize Quill content', e);
        isInitializingModalRef.current = false;
        programmaticUpdateRef.current = false;
      }
    }, 80);
  }

  function cancelModalEdit() {
    isInitializingModalRef.current = false;
    setModalEditMode(false);
    setModalEditError("");
  }

  function handleModalEditChange(event) {
    const { name, value } = event.target;
    setModalEditForm((prev) => ({ ...prev, [name]: value }));
  }

  // New handler: don't update React state on every Quill change to avoid re-renders
  function handleQuillEditorChange(content, source) {
    console.log("[Debug] quill change -> source:", source, "programmatic:", programmaticUpdateRef.current, "initializing:", isInitializingModalRef.current);

    // Ignore non-user sources and programmatic updates
    if ((source && source !== "user") || programmaticUpdateRef.current) {
      console.log('[Debug] quill change ignored');
      return;
    }

    // mark that the user started editing
    if (isInitializingModalRef.current && !modalEditFormRef.current?.hasStartedEditing) {
      modalEditFormRef.current = { ...modalEditFormRef.current, hasStartedEditing: true };
    }

    // Save content to ref only (avoid state updates)
    modalEditFormRef.current = { ...modalEditFormRef.current, content };
  }

  async function handleModalEditSave(event) {
    event.preventDefault();
    setModalEditError("");

    if (!user) {
      setModalEditError("Please sign in to edit an article.");
      return;
    }

    const currentContent = modalEditFormRef.current?.content ?? modalEditForm.content;
    if (!modalEditForm.title || !currentContent || !modalEditForm.category) {
      setModalEditError("Title, category, and content are required.");
      return;
    }

    setModalEditLoading(true);
    try {
      await updateArticle(
        activeId,
        {
          title: modalEditForm.title,
          content: currentContent,
          category: modalEditForm.category,
          tags: modalEditForm.tags,
        },
      );
      await Promise.all([loadArticles(), refreshMeta()]);
      isInitializingModalRef.current = false;
      setModalEditMode(false);
      
      // Refresh the article display
      const data = await fetchArticle(activeId);
      setActiveArticle(data.item);
    } catch (error) {
      setModalEditError(error.message || "Failed to update article");
    } finally {
      setModalEditLoading(false);
    }
  }

  async function handleShareArticle() {
    const result = await shareArticle(activeId, activeArticle?.title);
    showToast({ 
      message: result.message, 
      tone: result.success ? "success" : "error" 
    });
  }

  async function handleDownloadPDF() {
    const result = await downloadArticleAsPDF(
      activeArticle?.title,
      markdownHtml,
      activeArticle?.author?.name || "Unknown",
      activeArticle?.category
    );
    showToast({ 
      message: result.message, 
      tone: result.success ? "success" : "error" 
    });
  }

  async function handleToggleBookmark() {
    try {
      await toggleBookmark(activeId);
      setIsBookmarked(!isBookmarked);
      showToast({
        message: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        tone: "success",
      });
    } catch (error) {
      showToast({
        message: error.message || "Failed to bookmark article",
        tone: "error",
      });
    }
  }

  async function loadRelatedArticles() {
    if (!activeId) return;
    setRelatedLoading(true);
    try {
      const data = await getRelatedArticles(activeId);
      setRelatedArticles(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setRelatedArticles([]);
    } finally {
      setRelatedLoading(false);
    }
  }

  async function handleSaveDraft(event) {
    event.preventDefault();
    setEditorError("");

    if (!user) {
      setEditorError("Please sign in to save drafts.");
      return;
    }

    if (!editor.title || !editor.content || !editor.category) {
      setEditorError("Title, category, and content are required.");
      return;
    }

    setEditorLoading(true);
    try {
      await saveDraft({
        title: editor.title,
        content: editor.content,
        category: editor.category,
        tags: editor.tags,
      });

      setEditor({ title: "", category: "", tags: "", content: "" });
      showToast({ message: "Article saved as draft", tone: "success" });
      setShowEditor(false);
    } catch (error) {
      setEditorError(error.message || "Failed to save draft");
    } finally {
      setEditorLoading(false);
    }
  }

  async function loadDrafts() {
    setDraftsLoading(true);
    try {
      const data = await getDrafts();
      setDrafts(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setDrafts([]);
    } finally {
      setDraftsLoading(false);
    }
  }

  async function handlePublishDraft(draftId) {
    try {
      await publishDraft(draftId);
      await loadArticles();
      await loadDrafts();
      showToast({ message: "Draft published successfully", tone: "success" });
    } catch (error) {
      showToast({
        message: error.message || "Failed to publish draft",
        tone: "error",
      });
    }
  }

  async function handleDeleteArticle() {
    if (!activeArticle || !user || user.role !== "admin") {
      showToast({ message: "Only admins can delete articles", tone: "error" });
      return;
    }
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteArticle() {
    if (!activeArticle) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteArticle(activeArticle._id || activeArticle.id);
      setShowDeleteConfirm(false);
      setModalOpen(false);
      await loadArticles();
      showToast({ message: "Article deleted successfully", tone: "success" });
    } catch (error) {
      showToast({
        message: error.message || "Failed to delete article",
        tone: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  const markdownHtml = useMemo(() => {
    if (!activeArticle?.content) {
      return "";
    }

    const raw = marked.parse(activeArticle.content, { breaks: true });
    return DOMPurify.sanitize(raw);
  }, [activeArticle?.content]);

  return (
    <>
      <section className="card fade-up card--compact">
        <div className="card__header">
          <h3>Articles</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={() => {
                  loadDrafts();
                  setShowDrafts(true);
                }}
              >
                <Icon name="drafts" size={14} className="icon--inline" /> My Drafts
              </button>
              <button
                className="btn btn--primary btn--small"
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setShowEditor(true);
                }}
              >
                <Icon name="plus" size={14} className="icon--inline" /> Add article
              </button>
          </div>
          </div>
        {metaError ? <p className="muted">{metaError}</p> : null}
        <div className="filters-row">
          <div className="search search--compact">
            <span className="search__icon">/</span>
            <input
              type="text"
              placeholder="Search articles, tags, people"
              aria-label="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <label className="filters-field">
            <span className="muted">Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              disabled={metaLoading}
            >
              <option value="">All categories</option>
              {meta.categories.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filters-field">
            <span className="muted">Tag</span>
            <select
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              disabled={metaLoading}
            >
              <option value="">All tags</option>
              {meta.tags.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card fade-up">
        <div className="card__header">
          <h3>Article Library</h3>
        </div>
        <div className="list">
          {articlesLoading ? (
            <p className="muted">Loading articles...</p>
          ) : articlesError ? (
            <p className="muted">{articlesError}</p>
          ) : articles.length === 0 ? (
            <p className="muted">No articles yet.</p>
          ) : (
            articles.map((article) => {
              const isEditing = editingId === (article._id || article.id);

              return (
                <article
                  className={`list__item ${isEditing ? "" : "list__item--clickable"}`}
                  key={article._id || article.id}
                  onClick={isEditing ? undefined : () => openArticle(article)}
                  onKeyDown={
                    isEditing
                      ? undefined
                      : (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openArticle(article);
                          }
                        }
                  }
                  role={isEditing ? undefined : "button"}
                  tabIndex={isEditing ? undefined : 0}
                  aria-label={isEditing ? undefined : `Open ${article.title}`}
                >
                  {isEditing ? (
                  <form className="editor editor--inline" onSubmit={handleEditSave}>
                    <div className="editor__meta">
                      <input
                        type="text"
                        name="title"
                        placeholder="Article title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        required
                      />
                      <input
                        type="text"
                        name="category"
                        list="category-list-edit"
                        placeholder="Category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        required
                      />
                      <datalist id="category-list-edit">
                        {meta.categories.map((item) => (
                          <option key={item.name} value={item.name} />
                        ))}
                      </datalist>
                      <input
                        type="text"
                        name="tags"
                        placeholder="Tags: runbook, api"
                        value={editForm.tags}
                        onChange={handleEditChange}
                      />
                    </div>
                    <textarea
                      rows="5"
                      name="content"
                      value={editForm.content}
                      onChange={handleEditChange}
                      placeholder="# Markdown content"
                      required
                    />
                    {editError ? <p className="form-error">{editError}</p> : null}
                    <div className="editor__actions">
                      <button className="btn btn--ghost" type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button
                        className="btn btn--primary"
                        type="submit"
                        disabled={editLoading}
                      >
                        {editLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <span className="list__title">{article.title}</span>
                      <p className="list__meta">
                        {article.excerpt || extractPlainText(article.content)?.slice(0, 120) || ""}
                      </p>
                      <div className="badges">
                        {article.category ? (
                          <span className="badge">{article.category}</span>
                        ) : null}
                        {(article.tags || []).map((tag) => (
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
                  </>
                  )}
                </article>
              );
            })
          )}
        </div>
        {Math.ceil(totalArticles / limit) > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                <button className="btn btn--ghost btn--small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span className="muted">Page {page} of {Math.ceil(totalArticles / limit)}</span>
                <button className="btn btn--ghost btn--small" disabled={page === Math.ceil(totalArticles / limit)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
        )}
      </section>

      {modalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setModalOpen(false)}>
          <div
            className={`modal ${modalEditMode ? "modal--edit" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {!modalEditMode ? (
              <>
                <div className="modal__header">
                  <div>
                    <p className="eyebrow">{activeArticle?.category || "Uncategorized"}</p>
                    <h3 id="article-modal-title">{activeArticle?.title || "Article"}</h3>
                    <p className="muted">
                      {activeArticle?.author?.name ? `By ${activeArticle.author.name}` : ""}
                      {activeArticle?.updatedAt
                        ? ` · Updated ${new Date(activeArticle.updatedAt).toLocaleDateString()}`
                        : ""}
                      {activeArticle?.viewCount ? ` · 👁 ${activeArticle.viewCount} views` : ""}
                    </p>
                  </div>
                  <div className="modal__header-actions">
                    <button
                      className="btn btn--ghost btn--small"
                      type="button"
                      onClick={handleToggleBookmark}
                      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                      {isBookmarked ? "❤️" : "🤍"} {activeArticle?.bookmarkedBy?.length || 0}
                    </button>
                    {canEdit(activeArticle) ? (
                      <button
                        className="btn btn--ghost btn--small"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          startModalEdit(activeArticle);
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                    {user && user.role === "admin" ? (
                      <button
                        className="btn btn--ghost btn--small btn--danger-text"
                        type="button"
                        onClick={handleDeleteArticle}
                        title="Delete article"
                      >
                        Delete
                      </button>
                    ) : null}
                    <button
                      className="btn btn--ghost btn--small"
                      type="button"
                      onClick={() => setModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {detailLoading ? (
                  <p className="muted">Loading article...</p>
                ) : detailError ? (
                  <p className="muted">{detailError}</p>
                ) : (
                  <div className="modal__body">
                    <div className="badges">
                      {(activeArticle?.tags || []).map((tag) => (
                        <span className="badge badge--ghost" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="markdown" dangerouslySetInnerHTML={{ __html: markdownHtml }} />

                    <Comments articleId={activeId} />

                    {relatedArticles && relatedArticles.length > 0 ? (
                      <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--color-border)" }}>
                        <h4>Related Articles</h4>
                        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                          {relatedArticles.slice(0, 5).map((relatedArticle) => (
                            <article
                              key={relatedArticle._id || relatedArticle.id}
                              style={{
                                padding: "1rem",
                                borderRadius: "0.375rem",
                                backgroundColor: "var(--color-bg-secondary)",
                                cursor: "pointer",
                                transition: "background-color 0.2s"
                              }}
                              onClick={() => {
                                openArticle(relatedArticle);
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg-secondary)"}
                            >
                              <p className="list__title">{relatedArticle.title}</p>
                              <p className="list__meta">
                                {relatedArticle.excerpt || extractPlainText(relatedArticle.content)?.slice(0, 80)}
                              </p>
                              <p className="muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                                {relatedArticle.author?.name ? `By ${relatedArticle.author.name}` : ""}
                              </p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {activeId ? (
                  <div className="modal__footer">
                    <div className="modal__footer-actions">
                      <button 
                        className="btn btn--ghost btn--small"
                        type="button"
                        onClick={handleShareArticle}
                      >
                        Share Link
                      </button>
                      <button 
                        className="btn btn--ghost btn--small"
                        type="button"
                        onClick={handleDownloadPDF}
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <form 
                className="editor modal-editor" 
                onSubmit={handleModalEditSave}
              >
                <div className="modal__header">
                  <div>
                    <p className="eyebrow">Edit Article</p>
                    <h3 id="article-modal-title">Rich Text Editor</h3>
                    <p className="muted">Make changes with formatted text tools.</p>
                  </div>
                  <button
                    className="btn btn--ghost btn--small"
                    type="button"
                    onClick={cancelModalEdit}
                  >
                    Close
                  </button>
                </div>
                <div className="modal-editor-content">
                  <div className="editor__meta">
                    <input
                      type="text"
                      name="title"
                      placeholder="Article title"
                      value={modalEditForm.title}
                      onChange={handleModalEditChange}
                      required
                    />
                    <input
                      type="text"
                      name="category"
                      list="category-list-modal"
                      placeholder="Category"
                      value={modalEditForm.category}
                      onChange={handleModalEditChange}
                      required
                    />
                    <datalist id="category-list-modal">
                      {meta.categories.map((item) => (
                        <option key={item.name} value={item.name} />
                      ))}
                    </datalist>
                    <input
                      type="text"
                      name="tags"
                      placeholder="Tags: runbook, api"
                      value={modalEditForm.tags}
                      onChange={handleModalEditChange}
                    />
                  </div>
                  <div className="quill-wrapper quill-wrapper--large">
                    <ReactQuill
                      ref={quillRefModal}
                      theme="snow"
                      onChange={(content, delta, source, editor) => handleQuillEditorChange(content, source)}
                      modules={{
                        toolbar: {
                          container: [
                            ["bold", "italic", "underline", "strike"],
                            ["blockquote", "code-block"],
                            [{ header: 1 }, { header: 2 }],
                            [{ list: "ordered" }, { list: "bullet" }],
                            [{ size: ["small", false, "large", "huge"] }],
                            [{ color: [] }, { background: [] }],
                            ["link", "image", "video"],
                            ["clean"],
                          ],
                          handlers: {
                            image: () => handleImageUpload(quillRefModal, true),
                            video: () => handleVideoUpload(quillRefModal),
                          },
                        },
                        clipboard: {
                          matchVisual: false,
                        },
                      }}
                      placeholder="Describe your article..."
                    />
                  </div>
                  {modalEditError ? <p className="form-error">{modalEditError}</p> : null}
                  <div className="editor-help" style={{ fontSize: "12px", color: "var(--muted)", marginTop: "-8px" }}>
                    💡 <strong>Image & Video:</strong> Click the image/video buttons in the toolbar, or use:
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => handleImageUpload(quillRefModal, true)}
                      style={{ marginLeft: "8px" }}
                    >
                      📷 Upload Image
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => handleVideoUpload(quillRefModal)}
                      style={{ marginLeft: "4px" }}
                    >
                      🎥 Add Video URL
                    </button>
                  </div>
                </div>
                <div className="modal__footer modal__footer--divider">
                  <div className="modal__footer-actions">
                    <button className="btn btn--ghost" type="button" onClick={cancelModalEdit}>
                      Cancel
                    </button>
                    <button
                      className="btn btn--primary"
                      type="submit"
                      disabled={modalEditLoading}
                    >
                      {modalEditLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      ) : null}

      {showEditor ? (
        <div className="modal-overlay" role="presentation" onClick={() => setShowEditor(false)}>
          <div
            className="modal modal--create"
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-editor-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <div>
                <p className="eyebrow">New Article</p>
                <h3 id="article-editor-title">Markdown Editor</h3>
                <p className="muted">Capture and publish knowledge for your team.</p>
              </div>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={() => setShowEditor(false)}
              >
                Close
              </button>
            </div>
            <form className="editor" onSubmit={handlePublish}>
              <div className="editor__meta">
                <input
                  type="text"
                  name="title"
                  placeholder="Article title"
                  value={editor.title}
                  onChange={handleEditorChange}
                  required
                />
                <input
                  type="text"
                  name="category"
                  list="category-list"
                  placeholder="Category"
                  value={editor.category}
                  onChange={handleEditorChange}
                  required
                />
                <datalist id="category-list">
                  {meta.categories.map((item) => (
                    <option key={item.name} value={item.name} />
                  ))}
                </datalist>
                <input
                  type="text"
                  name="tags"
                  placeholder="Tags: runbook, api"
                  value={editor.tags}
                  onChange={handleEditorChange}
                />
              </div>
              <textarea
                className="editor__textarea"
                rows="14"
                name="content"
                value={editor.content}
                onChange={handleEditorChange}
                placeholder="# Markdown content\nStart capturing knowledge...\n\nTip: You can paste HTML, formatted text, or markdown content directly!"
                required
                ref={editorContentRef}
                onPaste={handleEditorPaste}
              />
              {editorError ? <p className="form-error">{editorError}</p> : null}
              <div className="editor__actions">
                <button className="btn btn--primary" type="submit" disabled={editorLoading}>
                  {editorLoading ? "Publishing..." : "Publish"}
                </button>
                <button 
                  className="btn btn--ghost" 
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={editorLoading}
                >
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : showDrafts ? (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDrafts(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <div>
                <p className="eyebrow">My Drafts</p>
                <h3>Manage your drafts</h3>
              </div>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={() => setShowDrafts(false)}
              >
                Close
              </button>
            </div>
            <div className="list">
              {draftsLoading ? (
                <p className="muted">Loading drafts...</p>
              ) : drafts.length === 0 ? (
                <p className="muted">No drafts saved.</p>
              ) : (
                drafts.map((draft) => (
                  <div className="list__item" key={draft._id || draft.id}>
                    <div>
                      <p className="list__title">{draft.title}</p>
                      <p className="list__meta">{draft.category}</p>
                    </div>
                    <div className="list__aside">
                      <button
                        className="btn btn--ghost btn--small"
                        type="button"
                        onClick={() => handlePublishDraft(draft._id || draft.id)}
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="modal modal--confirm"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <div>
                <p className="eyebrow">Confirm Delete</p>
                <h3>Delete Article?</h3>
              </div>
            </div>
            <p className="muted">
              Are you sure you want to delete "<strong>{activeArticle?.title}</strong>"? This action cannot be undone.
            </p>
            <div className="modal__footer modal__footer--divider">
              <div className="modal__footer-actions">
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={confirmDeleteArticle}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Articles;
