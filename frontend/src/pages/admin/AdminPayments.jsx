import { useEffect, useMemo, useState } from "react";
import { orderApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";
import { downloadOrderInvoice } from "../../utils/downloadOrderInvoice";
import { canDownloadInvoice } from "../../utils/canDownloadInvoice";

const AdminPayments = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const response = await orderApi.listAll();
      setOrders(response.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.paymentStatus === filter);
  }, [orders, filter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(filtered, {
    pageSize: 10,
    resetKey: filter,
  });

  const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");
  const pending = orders.filter((o) => o.paymentStatus === "Pending").length;
  const paidTotal = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  async function updatePayment(orderId, paymentStatus) {
    setUpdatingId(orderId);
    try {
      await orderApi.updatePayment(orderId, {
        paymentStatus,
        paymentNote:
          paymentStatus === "Paid"
            ? "Marked paid by admin"
            : paymentStatus === "Refunded"
              ? "Refunded by admin"
              : undefined,
      });
      await load();
    } catch (err) {
      notify.fromError(err, "Payment update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Payments</h2>
        <p className="page-subtitle">
          Platform-wide payment methods, IDs, and settlement status.
        </p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Collected</p>
          <h3>₹{paidTotal}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Paid</p>
          <h3>{paidOrders.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Pending</p>
          <h3>{pending}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">All Orders</p>
          <h3>{orders.length}</h3>
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
          <table className="data-table data-table--payments">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Payment</th>
                <th>Payment ID</th>
                <th className="aw-actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="table-order-id">
                      {order.orderNumber || order._id.slice(-8)}
                    </div>
                    <small className="muted">{order.orderStatus}</small>
                  </td>
                  <td>{order.customerId?.email || "—"}</td>
                  <td>{order.storeId?.storeName || "—"}</td>
                  <td className="table-num">₹{order.totalAmount}</td>
                  <td>{order.paymentMethod || "—"}</td>
                  <td>
                    <span className="status-chip">{order.paymentStatus}</span>
                  </td>
                  <td>
                    <small className="muted">{order.paymentId || "—"}</small>
                  </td>
                  <td className="aw-actions-cell">
                    <div className="aw-row-actions aw-row-actions--payments">
                      <div className="panel-action-slot panel-action-slot--wide">
                        {canDownloadInvoice(order) ? (
                          <button
                            type="button"
                            className="panel-btn secondary"
                            disabled={invoiceId === order._id}
                            onClick={() =>
                              downloadOrderInvoice(order, {
                                onStart: () => setInvoiceId(order._id),
                                onDone: () => setInvoiceId(null),
                              })
                            }
                          >
                            {invoiceId === order._id ? "Invoice…" : "Invoice PDF"}
                          </button>
                        ) : (
                          <span className="panel-action-placeholder" aria-hidden="true" />
                        )}
                      </div>
                      <div className="panel-action-slot">
                        {order.paymentStatus === "Pending" ? (
                          <button
                            type="button"
                            className="panel-btn"
                            disabled={updatingId === order._id}
                            onClick={() => updatePayment(order._id, "Paid")}
                          >
                            Mark Paid
                          </button>
                        ) : order.paymentStatus === "Paid" ? (
                          <button
                            type="button"
                            className="panel-btn secondary"
                            disabled={updatingId === order._id}
                            onClick={() => updatePayment(order._id, "Refunded")}
                          >
                            Refund
                          </button>
                        ) : (
                          <span className="panel-action-placeholder" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 ? <p className="muted">No payment records.</p> : null}
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

export default AdminPayments;
