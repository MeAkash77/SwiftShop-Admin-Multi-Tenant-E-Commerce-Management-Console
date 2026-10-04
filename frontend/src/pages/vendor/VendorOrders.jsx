import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { orderApi, storeApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import VendorRowActions from "../../components/vendor/VendorRowActions";
import { notify } from "../../utils/notify";
import { downloadOrderInvoice } from "../../utils/downloadOrderInvoice";
import { canDownloadInvoice } from "../../utils/canDownloadInvoice";
import {
  ORDER_ACTION_LABEL,
  ORDER_NEXT_STATUSES,
  orderStatusChipClass,
  paymentStatusChipClass,
  shortOrderLabel,
} from "../../utils/vendorStatus";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "Pending", label: "Pending" },
  { id: "Confirmed", label: "Confirmed" },
  { id: "Processing", label: "Processing" },
  { id: "Shipped", label: "Shipped" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Returned", label: "Returned" },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

const VendorOrders = () => {
  const user = useSelector((state) => state.user.user);
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const storeRes = await storeApi.getByVendor(user.id);
        if (!active) return;
        const storeData = storeRes.data.data;
        setStore(storeData);
        const ordersRes = await orderApi.byStore(storeData._id);
        if (!active) return;
        setOrders(ordersRes.data?.data || ordersRes.data || []);
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 404) {
          setStore(null);
          setOrders([]);
        } else {
          notify.fromError(err, "Unable to load store orders.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (user?.id) load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function reloadOrders() {
    const storeRes = await storeApi.getByVendor(user.id);
    const storeData = storeRes.data.data;
    setStore(storeData);
    const ordersRes = await orderApi.byStore(storeData._id);
    setOrders(ordersRes.data?.data || ordersRes.data || []);
  }

  async function changeStatus(orderId, status) {
    setBusyId(orderId);
    try {
      await orderApi.updateStatus(orderId, status);
      notify.success(`Order updated to ${status}`);
      await reloadOrders();
    } catch (err) {
      notify.fromError(err, "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function refundOrder(order) {
    const note = window.prompt(
      `Refund ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")} for order ${
        order.orderNumber || shortOrderLabel(order)
      }?\n\nOptional note for the customer:`,
      "Refunded by store"
    );
    if (note === null) return;
    setBusyId(order._id);
    try {
      await orderApi.updatePayment(order._id, {
        paymentStatus: "Refunded",
        paymentNote: note.trim() || "Refunded by vendor",
      });
      notify.success("Payment marked as refunded");
      await reloadOrders();
    } catch (err) {
      notify.fromError(err, "Refund failed");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const map = { all: orders.length };
    for (const t of STATUS_TABS) {
      if (t.id === "all") continue;
      map[t.id] = orders.filter((o) => (o.orderStatus || "Pending") === t.id).length;
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "all" && (o.orderStatus || "Pending") !== tab) return false;
      if (!q) return true;
      const hay = `${o.orderNumber || ""} ${o._id} ${o.paymentMethod || ""} ${o.paymentStatus || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, tab, query]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(
    filtered,
    { pageSize: 10, resetKey: `${tab}:${query}` }
  );

  if (!loading && !store) {
    return (
      <div className="stack-gap">
        <section className="vendor-hero">
          <h2 className="page-title">Orders</h2>
          <p className="page-subtitle">Create your store before orders can appear.</p>
        </section>
        <div className="vendor-empty">
          <p>No store yet.</p>
          <Link className="panel-btn" to="/vendor/store">
            Create store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Orders</h2>
            <p className="page-subtitle">
              {store?.storeName ? `Store: ${store.storeName}` : "Fulfill customer orders"}
            </p>
          </div>
          <div className="vendor-hero-actions">
            <button
              type="button"
              className="panel-btn secondary"
              disabled={loading}
              onClick={() => reloadOrders().catch((e) => notify.fromError(e))}
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="vendor-tabs" role="tablist" aria-label="Order status">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`vendor-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <em>{counts[t.id] ?? 0}</em>
          </button>
        ))}
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search order number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search orders"
        />
      </div>

      <div className="table-card">
        {loading ? (
          <p className="muted" style={{ padding: "1rem" }}>
            Loading orders…
          </p>
        ) : !pageItems.length ? (
          <div className="vendor-empty">
            <p>
              {orders.length
                ? "No orders in this filter."
                : "No orders yet. They’ll show up when customers checkout."}
            </p>
            {orders.length ? (
              <button type="button" className="panel-btn secondary" onClick={() => setTab("all")}>
                Show all
              </button>
            ) : (
              <Link className="panel-btn secondary" to="/vendor/product-table">
                View products
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table data-table--orders">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Method</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((order) => {
                    const next = ORDER_NEXT_STATUSES[order.orderStatus] || [];
                    const primary = next[0];
                    const secondary = next.slice(1);
                    const showInvoice = canDownloadInvoice(order);
                    const canRefund = order.paymentStatus === "Paid";
                    const moreOptions = [
                      ...secondary.map((status) => ({
                        value: status,
                        label: ORDER_ACTION_LABEL[status] || status,
                      })),
                      ...(canRefund
                        ? [{ value: "__refund", label: "Refund payment" }]
                        : []),
                      ...(showInvoice
                        ? [{ value: "__invoice", label: "Download invoice" }]
                        : []),
                    ];

                    return (
                      <tr key={order._id}>
                        <td>
                          <strong className="table-order-id">{shortOrderLabel(order)}</strong>
                        </td>
                        <td className="muted">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="table-num">{money(order.totalAmount)}</td>
                        <td>{order.paymentMethod || "—"}</td>
                        <td>
                          <span className={paymentStatusChipClass(order.paymentStatus)}>
                            {order.paymentStatus || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={orderStatusChipClass(order.orderStatus)}>
                            {order.orderStatus || "—"}
                          </span>
                        </td>
                        <td className="vendor-actions-cell">
                          <VendorRowActions
                            disabled={busyId === order._id || invoiceId === order._id}
                            moreOptions={moreOptions}
                            onMore={(value) => {
                              if (value === "__invoice") {
                                downloadOrderInvoice(order, {
                                  onStart: () => setInvoiceId(order._id),
                                  onDone: () => setInvoiceId(null),
                                });
                                return;
                              }
                              if (value === "__refund") {
                                refundOrder(order);
                                return;
                              }
                              changeStatus(order._id, value);
                            }}
                            primary={
                              primary ? (
                                <button
                                  type="button"
                                  className={
                                    primary === "Cancelled" || primary === "Returned"
                                      ? "panel-btn secondary"
                                      : "panel-btn"
                                  }
                                  disabled={busyId === order._id}
                                  onClick={() => changeStatus(order._id, primary)}
                                >
                                  {busyId === order._id
                                    ? "…"
                                    : ORDER_ACTION_LABEL[primary] || primary}
                                </button>
                              ) : canRefund ? (
                                <button
                                  type="button"
                                  className="panel-btn secondary"
                                  disabled={busyId === order._id}
                                  onClick={() => refundOrder(order)}
                                >
                                  {busyId === order._id ? "…" : "Refund"}
                                </button>
                              ) : null
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              from={from}
              to={to}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VendorOrders;
