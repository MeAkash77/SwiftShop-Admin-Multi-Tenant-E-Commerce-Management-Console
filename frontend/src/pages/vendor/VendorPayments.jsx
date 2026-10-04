import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { orderApi, storeApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import VendorRowActions from "../../components/vendor/VendorRowActions";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";
import { downloadOrderInvoice } from "../../utils/downloadOrderInvoice";
import { canDownloadInvoice } from "../../utils/canDownloadInvoice";
import {
  orderStatusChipClass,
  paymentStatusChipClass,
  shortOrderLabel,
} from "../../utils/vendorStatus";

const VendorPayments = () => {
  const user = useSelector((state) => state.user.user);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const storeRes = await storeApi.getByVendor(user.id);
      const store = storeRes.data.data;
      const ordersRes = await orderApi.byStore(store._id);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
    } catch (err) {
      notify.fromError(err, "Unable to load store payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.paymentStatus === filter);
  }, [orders, filter]);

  const paid = orders.filter((o) => o.paymentStatus === "Paid");
  const pending = orders.filter((o) => o.paymentStatus === "Pending");
  const paidTotal = paid.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(filtered, {
    pageSize: 10,
    resetKey: filter,
  });

  async function updatePayment(orderId, paymentStatus) {
    let paymentNote;
    if (paymentStatus === "Paid") {
      paymentNote = "Marked paid by vendor";
    } else if (paymentStatus === "Refunded") {
      const note = window.prompt(
        "Refund this payment?\n\nOptional note for the customer:",
        "Refunded by store"
      );
      if (note === null) return;
      paymentNote = note.trim() || "Refunded by vendor";
    } else if (paymentStatus === "Failed") {
      paymentNote = "Marked failed by vendor";
    }

    setUpdatingId(orderId);
    try {
      await orderApi.updatePayment(orderId, {
        paymentStatus,
        paymentNote,
      });
      notify.success(`Payment marked ${paymentStatus}`);
      await load();
    } catch (err) {
      notify.fromError(err, "Payment update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Payments</h2>
            <p className="page-subtitle">
              Customer payment status (COD / online) — not payouts
            </p>
          </div>
          <div className="vendor-hero-actions">
            <button type="button" className="panel-btn secondary" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Collected</p>
          <h3>₹{paidTotal}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Paid orders</p>
          <h3>{paid.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Pending</p>
          <h3>{pending.length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All payments</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading payments...</p> : null}

      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Order status</th>
                <th>Payment</th>
                <th>Payment ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => {
                const moreOptions = [];
                if (order.paymentStatus === "Pending") {
                  moreOptions.push({ value: "Failed", label: "Mark failed" });
                }
                if (canDownloadInvoice(order)) {
                  moreOptions.push({ value: "__invoice", label: "Download invoice" });
                }

                return (
                  <tr key={order._id}>
                    <td>
                      <div className="table-order-id">{shortOrderLabel(order)}</div>
                    </td>
                    <td className="table-num">₹{order.totalAmount}</td>
                    <td>{order.paymentMethod || "—"}</td>
                    <td>
                      <span className={orderStatusChipClass(order.orderStatus)}>
                        {order.orderStatus || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={paymentStatusChipClass(order.paymentStatus)}>
                        {order.paymentStatus || "—"}
                      </span>
                    </td>
                    <td>
                      <small className="muted">{order.paymentId || "—"}</small>
                    </td>
                    <td className="vendor-actions-cell">
                      <VendorRowActions
                        disabled={updatingId === order._id || invoiceId === order._id}
                        moreOptions={moreOptions}
                        moreAriaLabel="More payment actions"
                        onMore={(value) => {
                          if (value === "__invoice") {
                            downloadOrderInvoice(order, {
                              onStart: () => setInvoiceId(order._id),
                              onDone: () => setInvoiceId(null),
                            });
                            return;
                          }
                          updatePayment(order._id, value);
                        }}
                        primary={
                          order.paymentStatus === "Pending" ? (
                            <button
                              type="button"
                              className="panel-btn"
                              disabled={updatingId === order._id}
                              onClick={() => updatePayment(order._id, "Paid")}
                            >
                              {updatingId === order._id ? "…" : "Mark paid"}
                            </button>
                          ) : order.paymentStatus === "Paid" ? (
                            <button
                              type="button"
                              className="panel-btn secondary"
                              disabled={updatingId === order._id}
                              onClick={() => updatePayment(order._id, "Refunded")}
                            >
                              {updatingId === order._id ? "…" : "Refund"}
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
        {!loading && filtered.length === 0 ? (
          <p className="muted">No payment records for this store.</p>
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
};

export default VendorPayments;
