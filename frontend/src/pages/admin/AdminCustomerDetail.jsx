import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { orderApi, userApi } from "../../api/services";
import AdminReasonModal from "../../components/admin/AdminReasonModal";
import { notify } from "../../utils/notify";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

/**
 * Customer 360 — profile + orders for marketplace operators.
 */
export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [userRes, orderRes] = await Promise.all([
        userApi.getById(id),
        orderApi.byCustomer(id).catch(() => ({ data: { data: [] } })),
      ]);
      setUser(userRes.data?.data || userRes.data?.user || userRes.data);
      setOrders(orderRes.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load customer.");
      navigate("/admin/customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [id]);

  const isActive = user?.isActive !== false;

  const totals = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "Paid");
    const gmv = paid.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { count: orders.length, gmv };
  }, [orders]);

  async function onConfirmSuspend(reason) {
    setBusy(true);
    try {
      await userApi.toggleStatus(id, false);
      notify.success(`Customer deactivated.${reason ? ` Reason saved locally.` : ""}`);
      // Persist reason lightly for operator context until AuditLog exists
      try {
        const key = `admin_note_customer_${id}`;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({
          at: new Date().toISOString(),
          action: "deactivate",
          reason,
        });
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
      } catch {
        // ignore
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to deactivate.");
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    setBusy(true);
    try {
      await userApi.toggleStatus(id, true);
      notify.success("Customer activated.");
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to activate.");
    } finally {
      setBusy(false);
    }
  }

  const notes = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`admin_note_customer_${id}`) || "[]");
    } catch {
      return [];
    }
  }, [id, user?.isActive]);

  if (loading) return <p className="muted">Loading customer…</p>;
  if (!user) return null;

  return (
    <div className="stack-gap">
      <p className="muted" style={{ margin: 0 }}>
        <Link to="/admin/customers">← Customers</Link>
      </p>

      <div className="aw-record-header aw-card">
        <div>
          <span className={`status-chip ${isActive ? "status-chip--ok" : "status-chip--bad"}`}>
            {isActive ? "Active" : "Suspended"}
          </span>
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {user.email}
            {user.phoneNumber ? ` · ${user.phoneNumber}` : ""}
            {user.createdAt
              ? ` · Joined ${new Date(user.createdAt).toLocaleDateString()}`
              : ""}
          </p>
          <p className="muted" style={{ margin: "0.5rem 0 0" }}>
            {totals.count} orders · {formatCurrency(totals.gmv)} paid GMV
          </p>
        </div>
        <div className="aw-record-actions">
          {isActive ? (
            <button
              type="button"
              className="panel-btn danger"
              onClick={() => setModalOpen(true)}
              disabled={busy}
            >
              Deactivate
            </button>
          ) : (
            <button type="button" className="panel-btn" onClick={activate} disabled={busy}>
              Activate
            </button>
          )}
          <Link className="panel-btn secondary" to="/admin/orders">
            All orders
          </Link>
        </div>
      </div>

      <div className="aw-tabs" role="tablist">
        <button
          type="button"
          className={`aw-tab${tab === "orders" ? " is-active" : ""}`}
          onClick={() => setTab("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          className={`aw-tab${tab === "overview" ? " is-active" : ""}`}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
      </div>

      {tab === "orders" ? (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <Link to={`/admin/orders?highlight=${o._id}`}>
                      {o.orderNumber || o._id}
                    </Link>
                  </td>
                  <td>{o.storeId?.storeName || "—"}</td>
                  <td>
                    <span className="status-chip">{o.orderStatus}</span>
                  </td>
                  <td>
                    <span className="status-chip">{o.paymentStatus}</span>
                  </td>
                  <td>{formatCurrency(o.totalAmount)}</td>
                  <td>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 ? <p className="muted">No orders for this customer.</p> : null}
        </div>
      ) : (
        <div className="aw-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <p className="muted">Role: {user.role}</p>
          <p className="muted">
            Email verified: {user.isEmailVerified ? "Yes" : "No"}
          </p>
          <h3>Operator notes</h3>
          {notes.length === 0 ? (
            <p className="muted">No notes yet. Deactivate actions save a reason here.</p>
          ) : (
            <ul>
              {notes.map((n, i) => (
                <li key={`${n.at}-${i}`}>
                  <strong>{n.action}</strong> — {n.reason}{" "}
                  <span className="muted">
                    ({new Date(n.at).toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AdminReasonModal
        open={modalOpen}
        title="Deactivate customer"
        description="They will not be able to sign in until reactivated."
        confirmLabel="Deactivate customer"
        onCancel={() => setModalOpen(false)}
        onConfirm={onConfirmSuspend}
        busy={busy}
      />
    </div>
  );
}
