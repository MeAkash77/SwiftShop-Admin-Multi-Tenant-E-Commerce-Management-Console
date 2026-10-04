import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  orderApi,
  productApi,
  storeApi,
  unwrapList,
} from "../../api/services";
import AdminReasonModal from "../../components/admin/AdminReasonModal";
import { notify } from "../../utils/notify";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

/**
 * Store / Vendor 360 — KPIs, products, orders, suspend with reason.
 */
export default function AdminStoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const storeRes = await storeApi.getById(id);
      const s = storeRes.data?.data || storeRes.data;
      setStore(s);

      const [prodRes, orderRes] = await Promise.all([
        productApi.list({ store: id, page: 1, limit: 100 }).catch(() => ({ data: [] })),
        orderApi.byStore(id).catch(() => ({ data: { data: [] } })),
      ]);
      setProducts(unwrapList(prodRes.data).data);
      setOrders(orderRes.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load store.");
      navigate("/admin/stores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [id]);

  const isActive = store?.isActive !== false;
  const vendor = store?.vendorId;

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "Paid");
    const gmv = paid.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const activeProducts = products.filter((p) => p.status === "active" || p.isActive !== false)
      .length;
    return {
      gmv,
      orders: orders.length,
      products: products.length,
      activeProducts,
    };
  }, [orders, products]);

  async function onConfirmSuspend(reason) {
    setBusy(true);
    try {
      await storeApi.update(id, { isActive: false });
      try {
        const key = `admin_note_store_${id}`;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({ at: new Date().toISOString(), action: "suspend", reason });
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
      } catch {
        // ignore
      }
      notify.success("Store suspended.");
      setModalOpen(false);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to suspend store.");
    } finally {
      setBusy(false);
    }
  }

  async function reinstate() {
    setBusy(true);
    try {
      await storeApi.update(id, { isActive: true });
      notify.success("Store reinstated.");
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to reinstate.");
    } finally {
      setBusy(false);
    }
  }

  const notes = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`admin_note_store_${id}`) || "[]");
    } catch {
      return [];
    }
  }, [id, store?.isActive]);

  if (loading) return <p className="muted">Loading store…</p>;
  if (!store) return null;

  return (
    <div className="stack-gap">
      <p className="muted" style={{ margin: 0 }}>
        <Link to="/admin/stores">← Stores</Link>
      </p>

      <div className="aw-record-header aw-card">
        <div>
          <span className={`status-chip ${isActive ? "status-chip--ok" : "status-chip--bad"}`}>
            {isActive ? "Active" : "Suspended"}
          </span>
          <h2>{store.storeName}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {vendor
              ? `${vendor.firstName || ""} ${vendor.lastName || ""} · ${vendor.email || ""}`
              : store.email || "—"}
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
              Suspend store
            </button>
          ) : (
            <button type="button" className="panel-btn" onClick={reinstate} disabled={busy}>
              Reinstate
            </button>
          )}
          <Link className="panel-btn secondary" to={`/admin/products?store=${id}`}>
            View all products
          </Link>
        </div>
      </div>

      <div className="aw-kpi-strip">
        <div className="stat-card">
          <span>GMV (paid)</span>
          <strong>{formatCurrency(kpis.gmv)}</strong>
        </div>
        <div className="stat-card">
          <span>Orders</span>
          <strong>{kpis.orders}</strong>
        </div>
        <div className="stat-card">
          <span>Products</span>
          <strong>{kpis.products}</strong>
        </div>
        <div className="stat-card">
          <span>Active listings</span>
          <strong>{kpis.activeProducts}</strong>
        </div>
      </div>

      <div className="aw-tabs" role="tablist">
        {["overview", "products", "orders"].map((t) => (
          <button
            key={t}
            type="button"
            className={`aw-tab${tab === t ? " is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="aw-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Store details</h3>
          <p className="muted">{store.description || "No description."}</p>
          <p className="muted">Address: {store.address || "—"}</p>
          <p className="muted">
            Contact: {store.phone || "—"} · {store.email || "—"}
          </p>
          <h3>Suspend history</h3>
          {notes.length === 0 ? (
            <p className="muted">No operator notes yet.</p>
          ) : (
            <ul>
              {notes.map((n, i) => (
                <li key={`${n.at}-${i}`}>
                  <strong>{n.action}</strong> — {n.reason}{" "}
                  <span className="muted">({new Date(n.at).toLocaleString()})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "products" ? (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>
                    <span className="status-chip">{p.status || "—"}</span>
                  </td>
                  <td>{p.stock ?? p.totalStock ?? "—"}</td>
                  <td>{formatCurrency(p.price ?? p.basePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 ? <p className="muted">No products.</p> : null}
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
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
                  <td>
                    <span className="status-chip">{o.orderStatus}</span>
                  </td>
                  <td>
                    <span className="status-chip">{o.paymentStatus}</span>
                  </td>
                  <td>{formatCurrency(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 ? <p className="muted">No orders.</p> : null}
        </div>
      ) : null}

      <AdminReasonModal
        open={modalOpen}
        title="Suspend store"
        description="The store will be hidden from selling until reinstated. Enter a reason for the audit trail."
        confirmLabel="Suspend store"
        onCancel={() => setModalOpen(false)}
        onConfirm={onConfirmSuspend}
        busy={busy}
      />
    </div>
  );
}
