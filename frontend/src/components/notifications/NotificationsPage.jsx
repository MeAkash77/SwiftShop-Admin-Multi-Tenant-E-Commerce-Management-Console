import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../../api/services";
import Pagination from "../Pagination";
import usePagination from "../../hooks/usePagination";
import { notify } from "../../utils/notify";
import "../../layouts/PanelLayout.css";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * Shared notifications inbox for admin + vendor panels.
 */
export default function NotificationsPage({
  title = "Notifications",
  subtitle = "Requests and updates that need your attention.",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await notificationApi.list({
        limit: 50,
        unread: filter === "unread" ? "1" : undefined,
      });
      setItems(res.data?.data || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      notify.fromError(err, "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [filter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(items, { pageSize: 10, resetKey: filter });

  async function markOne(note) {
    if (note.readAt) {
      if (note.link) return;
      return;
    }
    try {
      await notificationApi.markRead(note._id);
      setItems((prev) =>
        prev.map((n) =>
          n._id === note._id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      notify.fromError(err, "Could not mark as read.");
    }
  }

  async function markAll() {
    setBusy(true);
    try {
      await notificationApi.markAllRead();
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
      notify.success("All notifications marked as read.");
    } catch (err) {
      notify.fromError(err, "Could not mark all as read.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">{title}</h2>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="vendor-hero-actions">
            <button
              type="button"
              className="panel-btn secondary"
              onClick={load}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="panel-btn"
              onClick={markAll}
              disabled={busy || unreadCount === 0}
            >
              Mark all read
            </button>
          </div>
        </div>
      </section>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Unread</p>
          <h3>{unreadCount}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Shown</p>
          <h3>{items.length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="unread">Unread only</option>
        </select>
      </div>

      {loading ? <p className="muted">Loading notifications…</p> : null}

      <div className="table-card">
        <div className="notif-page-list">
          {pageItems.map((note) => (
            <div
              key={note._id}
              className={`notif-page-item${note.readAt ? "" : " is-unread"}`}
            >
              <div className="notif-page-item__main">
                <h3>
                  {note.link ? (
                    <Link to={note.link} onClick={() => markOne(note)}>
                      {note.title}
                    </Link>
                  ) : (
                    note.title
                  )}
                </h3>
                {note.body ? <p>{note.body}</p> : null}
                <small className="muted">{formatWhen(note.createdAt)}</small>
              </div>
              <div className="notif-page-item__actions">
                {!note.readAt ? (
                  <button
                    type="button"
                    className="panel-btn secondary"
                    onClick={() => markOne(note)}
                  >
                    Mark read
                  </button>
                ) : (
                  <span className="muted">Read</span>
                )}
                {note.link ? (
                  <Link className="panel-btn" to={note.link} onClick={() => markOne(note)}>
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {!loading && items.length === 0 ? (
          <p className="muted" style={{ padding: "1rem" }}>
            No notifications yet. New orders, payouts, and store updates will appear here.
          </p>
        ) : null}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
