import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { chatApi } from "../../api/services";
import { notify } from "../../utils/notify";
import "../../layouts/PanelLayout.css";

const topicLabel = {
  general: "General",
  track_order: "Track order",
  cancel_order: "Cancel",
  return_order: "Return",
  payment: "Payment",
  product_request: "Product request",
  shipping: "Shipping",
};

const VendorSupport = () => {
  const [sessions, setSessions] = useState([]);
  const [productHistory, setProductHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState("inbox");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadInbox() {
    setLoading(true);
    try {
      const [sessRes, prodRes] = await Promise.all([
        chatApi.vendorSessions(),
        chatApi.vendorProductRequests(),
      ]);
      setSessions(sessRes.data?.data || []);
      setProductHistory(prodRes.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Could not load support inbox.");
      setSessions([]);
      setProductHistory([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await chatApi.get(selectedId);
        if (!cancelled) setDetail(res.data?.data || null);
      } catch (err) {
        if (!cancelled) notify.fromError(err, "Could not open chat.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const unread = useMemo(
    () => sessions.reduce((n, s) => n + (s.unreadByVendor || 0), 0),
    [sessions]
  );

  async function sendReply(e) {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      const res = await chatApi.vendorReply(selectedId, { text: reply.trim() });
      setDetail(res.data?.data || null);
      setReply("");
      await loadInbox();
      notify.success("Reply sent to customer.");
    } catch (err) {
      notify.fromError(err, "Reply failed.");
    } finally {
      setSending(false);
    }
  }

  async function markRequest(status) {
    if (!selectedId) return;
    try {
      const res = await chatApi.vendorReply(selectedId, {
        text: `Product request marked as ${status.replace("_", " ")}.`,
        productRequestStatus: status,
      });
      setDetail(res.data?.data || null);
      await loadInbox();
    } catch (err) {
      notify.fromError(err, "Update failed.");
    }
  }

  async function resolve() {
    if (!selectedId) return;
    try {
      await chatApi.resolve(selectedId);
      notify.success("Conversation resolved.");
      setSelectedId(null);
      await loadInbox();
    } catch (err) {
      notify.fromError(err, "Could not resolve.");
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Customer Support</h2>
        <p className="page-subtitle">
          Chat history for your store — order help and product requests from MultiAssist.
          {unread > 0 ? ` · ${unread} unread` : ""}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`panel-btn ${tab === "inbox" ? "" : "secondary"}`}
          onClick={() => setTab("inbox")}
        >
          Inbox ({sessions.length})
        </button>
        <button
          type="button"
          className={`panel-btn ${tab === "products" ? "" : "secondary"}`}
          onClick={() => setTab("products")}
        >
          Product request history ({productHistory.length})
        </button>
      </div>

      {loading ? <p className="muted">Loading…</p> : null}

      {tab === "products" ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Request</th>
                <th>Status</th>
                <th>When</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {productHistory.map((row) => (
                <tr key={row.sessionId}>
                  <td>
                    {row.customer?.firstName} {row.customer?.lastName}
                  </td>
                  <td>
                    {row.product?.name || row.productRequest?.productName || "—"}
                    {row.product?.sku ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        SKU {row.product.sku} · stock {row.product.stock}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <strong>{row.productRequest?.requestType}</strong>
                    <div className="muted" style={{ fontSize: 12, maxWidth: 280 }}>
                      {row.productRequest?.details}
                    </div>
                  </td>
                  <td>{row.productRequest?.status || "pending"}</td>
                  <td>
                    {row.lastMessageAt
                      ? new Date(row.lastMessageAt).toLocaleString("en-IN")
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="panel-btn secondary"
                      onClick={() => {
                        setTab("inbox");
                        setSelectedId(row.sessionId);
                      }}
                    >
                      Open chat
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && productHistory.length === 0 ? (
                <tr>
                  <td colSpan={6}>No product requests yet. Customers send these via MultiAssist.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 320px) 1fr",
            gap: 16,
            alignItems: "start",
          }}
          className="vendor-support-grid"
        >
          <div className="form-card" style={{ maxHeight: 640, overflow: "auto", padding: 0 }}>
            {sessions.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setSelectedId(s._id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom: "1px solid var(--border, #e2e8f0)",
                  background: selectedId === s._id ? "rgba(40,116,240,0.08)" : "transparent",
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>
                    {s.customerId?.firstName || "Customer"} {s.customerId?.lastName || ""}
                  </strong>
                  {s.unreadByVendor > 0 ? (
                    <span className="panel-badge" style={{ fontSize: 11 }}>
                      {s.unreadByVendor}
                    </span>
                  ) : null}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {topicLabel[s.topic] || s.topic} · {s.status}
                  {s.orderId?.orderNumber ? ` · ${s.orderId.orderNumber}` : ""}
                </div>
              </button>
            ))}
            {!loading && sessions.length === 0 ? (
              <p style={{ padding: 16 }} className="muted">
                No support threads linked to your store yet.
              </p>
            ) : null}
          </div>

          <div className="form-card">
            {!detail ? (
              <p className="muted">Select a conversation to view history and reply.</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{detail.subject || "Support"}</h3>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      {topicLabel[detail.topic] || detail.topic} · {detail.status}
                      {detail.orderId ? (
                        <>
                          {" "}
                          · Order{" "}
                          <Link to="/vendor/orders">{detail.orderId.orderNumber || "view"}</Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <button type="button" className="panel-btn secondary" onClick={resolve}>
                    Resolve
                  </button>
                </div>

                {detail.productRequest?.details ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: "rgba(40,116,240,0.06)",
                      border: "1px solid rgba(40,116,240,0.15)",
                    }}
                  >
                    <strong>Product request</strong>
                    <p style={{ margin: "6px 0" }}>{detail.productRequest.details}</p>
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                      Type: {detail.productRequest.requestType} · Status:{" "}
                      {detail.productRequest.status}
                      {detail.productRequest.productName
                        ? ` · ${detail.productRequest.productName}`
                        : ""}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="panel-btn secondary"
                        onClick={() => markRequest("in_progress")}
                      >
                        In progress
                      </button>
                      <button
                        type="button"
                        className="panel-btn"
                        onClick={() => markRequest("done")}
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        className="panel-btn danger"
                        onClick={() => markRequest("declined")}
                      >
                        Decline
                      </button>
                      {detail.productRequest.productId ? (
                        <Link className="panel-btn secondary" to="/vendor/products">
                          Open catalog
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: 14,
                    maxHeight: 340,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 8,
                    background: "rgba(15,23,42,0.03)",
                    borderRadius: 10,
                  }}
                >
                  {(detail.messages || []).map((m) => (
                    <div
                      key={m._id || `${m.role}-${m.createdAt}`}
                      style={{
                        alignSelf:
                          m.role === "vendor"
                            ? "flex-end"
                            : m.role === "customer"
                              ? "flex-start"
                              : "center",
                        maxWidth: "90%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background:
                          m.role === "vendor"
                            ? "#2874f0"
                            : m.role === "customer"
                              ? "#fff"
                              : "transparent",
                        color: m.role === "vendor" ? "#fff" : "inherit",
                        border: m.role === "bot" || m.role === "system" ? "1px dashed #cbd5e1" : "1px solid #e2e8f0",
                        fontSize: 14,
                      }}
                    >
                      <div className="muted" style={{ fontSize: 11, marginBottom: 2, color: m.role === "vendor" ? "rgba(255,255,255,0.75)" : undefined }}>
                        {m.role}
                      </div>
                      {m.text}
                    </div>
                  ))}
                </div>

                <form className="stack-gap" style={{ marginTop: 12 }} onSubmit={sendReply}>
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to help the customer — update order, stock, or next steps…"
                    required
                  />
                  <button type="submit" className="panel-btn" disabled={sending}>
                    {sending ? "Sending…" : "Send reply"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .vendor-support-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VendorSupport;
