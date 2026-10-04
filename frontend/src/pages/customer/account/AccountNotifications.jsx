import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../../../api/services";
import { notify } from "../../../utils/notify";

const PAGE_SIZE = 10;

const ICON_BY_TYPE = {
  "order.created": "fa-solid fa-bag-shopping",
  "order.confirmed": "fa-solid fa-circle-check",
  "order.processing": "fa-solid fa-box-open",
  "order.shipped": "fa-solid fa-truck-fast",
  "order.delivered": "fa-solid fa-house-circle-check",
  "order.cancelled": "fa-solid fa-ban",
  "order.returned": "fa-solid fa-rotate-left",
  "payment.paid": "fa-solid fa-credit-card",
  "payment.refunded": "fa-solid fa-rotate-left",
};

function timeLabel(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN");
}

const AccountNotifications = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (filter === "unread") params.unread = "true";
      const [listRes, countRes] = await Promise.all([
        notificationApi.list(params),
        notificationApi.unreadCount(),
      ]);
      setItems(listRes.data?.data || []);
      setTotal(listRes.data?.total || 0);
      setUnread(countRes.data?.unreadCount || 0);
    } catch (err) {
      setItems([]);
      notify.fromError(err, "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function openItem(note) {
    try {
      if (!note.readAt) {
        await notificationApi.markRead(note._id);
        setUnread((n) => Math.max(0, n - 1));
        setItems((prev) =>
          prev.map((n) =>
            n._id === note._id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      }
    } catch {
      // navigation should still proceed
    }
    if (note.link) navigate(note.link);
  }

  async function markAll() {
    try {
      await notificationApi.markAllRead();
      setUnread(0);
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      if (filter === "unread") load();
    } catch (err) {
      notify.fromError(err, "Could not update notifications.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="fk-panel">
      <div className="fk-panel-head">
        <h1>Notifications</h1>
        <p className="muted" style={{ margin: 0 }}>
          Order, delivery and payment updates from your account.
        </p>
      </div>

      <div className="fk-notify-toolbar">
        <div className="fk-notify-tabs">
          <button
            type="button"
            className={`fk-chip${filter === "all" ? " is-active" : ""}`}
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
          >
            All
          </button>
          <button
            type="button"
            className={`fk-chip${filter === "unread" ? " is-active" : ""}`}
            onClick={() => {
              setFilter("unread");
              setPage(1);
            }}
          >
            Unread{unread > 0 ? ` (${unread})` : ""}
          </button>
        </div>
        {unread > 0 ? (
          <button type="button" className="fk-btn-ghost" onClick={markAll}>
            Mark all read
          </button>
        ) : null}
      </div>

      {loading ? <p>Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p>
          {filter === "unread"
            ? "You're all caught up — no unread notifications."
            : "No notifications yet. Place an order to see updates here."}
        </p>
      ) : null}

      <div className="fk-notify-list">
        {items.map((note) => (
          <button
            type="button"
            className={`fk-notify-item${note.readAt ? "" : " is-unread"}`}
            key={note._id}
            onClick={() => openItem(note)}
          >
            <div className="fk-notify-icon">
              <i
                className={ICON_BY_TYPE[note.type] || "fa-solid fa-bell"}
                aria-hidden="true"
              />
            </div>
            <div>
              <h3>{note.title}</h3>
              {note.body ? <p>{note.body}</p> : null}
              <span>{timeLabel(note.createdAt)}</span>
            </div>
            {!note.readAt ? <span className="fk-notify-dot" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="fk-notify-pager">
          <button
            type="button"
            className="fk-btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="fk-btn-ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AccountNotifications;
