import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notificationApi } from "../../api/services";
import "./NotificationBell.css";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Topbar bell with unread badge + dropdown preview.
 * @param {{ listPath: string }} props
 */
export default function NotificationBell({ listPath }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationApi.unreadCount(),
        notificationApi.list({ limit: 6 }),
      ]);
      setUnread(countRes.data?.unreadCount || 0);
      setItems(listRes.data?.data || []);
    } catch {
      // silent — bell is non-critical
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 45000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
      setLoading(false);
    }
  }

  async function openItem(note) {
    try {
      if (!note.readAt) await notificationApi.markRead(note._id);
    } catch {
      // ignore
    }
    setOpen(false);
    setUnread((n) => Math.max(0, n - (note.readAt ? 0 : 1)));
    if (note.link) navigate(note.link);
    else navigate(listPath);
  }

  async function markAll() {
    try {
      await notificationApi.markAllRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch {
      // ignore
    }
  }

  return (
    <div className="notif-bell" ref={rootRef}>
      <button
        type="button"
        className="panel-icon-btn notif-bell__btn"
        onClick={toggle}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <i className="fa-solid fa-bell" aria-hidden="true" />
        {unread > 0 ? (
          <span className="notif-bell__badge">{unread > 99 ? "99+" : unread}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notif-bell__panel" role="dialog" aria-label="Notifications">
          <div className="notif-bell__head">
            <strong>Notifications</strong>
            {unread > 0 ? (
              <button type="button" className="notif-bell__link" onClick={markAll}>
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="notif-bell__list">
            {loading ? <p className="muted notif-bell__empty">Loading…</p> : null}
            {!loading && items.length === 0 ? (
              <p className="muted notif-bell__empty">No notifications yet.</p>
            ) : null}
            {items.map((note) => (
              <button
                type="button"
                key={note._id}
                className={`notif-bell__item${note.readAt ? "" : " is-unread"}`}
                onClick={() => openItem(note)}
              >
                <span className="notif-bell__title">{note.title}</span>
                {note.body ? <span className="notif-bell__body">{note.body}</span> : null}
                <span className="notif-bell__time">{timeAgo(note.createdAt)}</span>
              </button>
            ))}
          </div>
          <div className="notif-bell__foot">
            <Link to={listPath} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
