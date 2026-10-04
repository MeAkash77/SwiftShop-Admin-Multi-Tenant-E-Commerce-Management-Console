import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { chatApi } from "../../api/services";
import { notify } from "../../utils/notify";
import "./CustomerSupportChat.css";

const CustomerSupportChat = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const token = useSelector((state) => state.user.token);
  const isCustomer = Boolean(token && user?.role === "customer");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState("");
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (!open || !isCustomer) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await chatApi.session();
        if (!cancelled) setSession(res.data?.data || null);
      } catch (err) {
        if (!cancelled) notify.fromError(err, "Could not start support chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isCustomer]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, session?.messages?.length, sending]);

  async function send({ text, quickReplyId } = {}) {
    if (!session?._id || sending) return;
    const body = {
      text: text != null ? text : draft,
      quickReplyId: quickReplyId || undefined,
    };
    if (!body.quickReplyId && !String(body.text || "").trim()) return;

    setSending(true);
    try {
      const res = await chatApi.send(session._id, body);
      setSession(res.data?.data || null);
      setDraft("");
    } catch (err) {
      notify.fromError(err, "Message failed.");
    } finally {
      setSending(false);
    }
  }

  async function resolveChat() {
    if (!session?._id) return;
    try {
      const res = await chatApi.resolve(session._id);
      setSession(res.data?.data || null);
      notify.success("Marked resolved. Open chat again anytime.");
    } catch (err) {
      notify.fromError(err, "Could not resolve chat.");
    }
  }

  function onQuick(reply) {
    if (reply.href) {
      navigate(reply.href);
      return;
    }
    send({ quickReplyId: reply.id, text: reply.label });
  }

  function onOrderPick(order) {
    send({ text: order.orderNumber });
  }

  const messages = session?.messages || [];

  return (
    <div className="mc-chat">
      {open ? (
        <div className="mc-chat-panel" role="dialog" aria-label="Order support chat">
          <header className="mc-chat-head">
            <div>
              <strong>MultiAssist</strong>
              <span>Order & product help</span>
            </div>
            <div className="mc-chat-head-actions">
              {isCustomer && session ? (
                <button type="button" className="mc-chat-icon-btn" onClick={resolveChat} title="Resolve">
                  <i className="fa-solid fa-check" aria-hidden="true" />
                </button>
              ) : null}
              <button
                type="button"
                className="mc-chat-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </header>

          {!isCustomer ? (
            <div className="mc-chat-guest">
              <i className="fa-solid fa-headset" aria-hidden="true" />
              <h3>Sign in for order help</h3>
              <p>Track orders, cancel/return guidance, and product questions for sellers.</p>
              <Link className="shop-btn shop-btn-primary" to="/login" state={{ from: { pathname: "/customer" } }}>
                Login to chat
              </Link>
            </div>
          ) : (
            <>
              <div className="mc-chat-messages" ref={scrollerRef}>
                {loading ? <p className="mc-chat-muted">Connecting…</p> : null}
                {messages.map((msg) => (
                  <div
                    key={msg._id || `${msg.role}-${msg.createdAt}-${msg.text?.slice(0, 12)}`}
                    className={`mc-chat-bubble mc-chat-bubble--${msg.role}`}
                  >
                    <p>{msg.text}</p>
                    {msg.meta?.orders?.length ? (
                      <ul className="mc-chat-orders">
                        {msg.meta.orders.map((o) => (
                          <li key={o.orderId}>
                            <button type="button" onClick={() => onOrderPick(o)}>
                              <strong>{o.orderNumber}</strong>
                              <span>
                                {o.status} · ₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}
                              </span>
                              <em>{o.storeName}</em>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {msg.meta?.order ? (
                      <div className="mc-chat-order-card">
                        <strong>{msg.meta.order.orderNumber}</strong>
                        <span>
                          {msg.meta.order.status} · {msg.meta.order.paymentStatus}
                        </span>
                        <span>₹{Number(msg.meta.order.totalAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    ) : null}
                    {msg.meta?.links?.length ? (
                      <div className="mc-chat-links">
                        {msg.meta.links.map((link) => (
                          <Link key={link.href} to={link.href}>
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {msg.meta?.quickReplies?.length ? (
                      <div className="mc-chat-quick">
                        {msg.meta.quickReplies.map((q) => (
                          <button key={q.id || q.label} type="button" onClick={() => onQuick(q)}>
                            {q.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <form
                className="mc-chat-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask about an order or product…"
                  disabled={sending || loading}
                  maxLength={2000}
                />
                <button type="submit" className="shop-btn shop-btn-primary" disabled={sending || !draft.trim()}>
                  <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className={`mc-chat-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open order support chat"}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-comments"}`} aria-hidden="true" />
        {!open ? <span>Help</span> : null}
      </button>
    </div>
  );
};

export default CustomerSupportChat;
