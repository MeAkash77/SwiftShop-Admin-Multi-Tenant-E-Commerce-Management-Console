import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { orderApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import { completeRazorpayPayment } from "../../utils/completeRazorpayPayment";
import { downloadOrderInvoice } from "../../utils/downloadOrderInvoice";
import { canDownloadInvoice } from "../../utils/canDownloadInvoice";

const CustomerPayments = () => {
  const user = useSelector((state) => state.user.user);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [payMethod, setPayMethod] = useState("UPI");
  const [invoiceId, setInvoiceId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await orderApi.byCustomer(user.id);
      setOrders(response.data?.data || response.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load payments.");
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

  const paidTotal = orders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.paymentStatus === "Pending").length;

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(filtered, {
    pageSize: 10,
    resetKey: filter,
  });

  async function payNow(orderId) {
    setPayingId(orderId);
    try {
      const response = await orderApi.pay(orderId, payMethod);
      const order = response.data?.data;
      const razorpay = response.data?.razorpay;
      await completeRazorpayPayment({
        order,
        razorpay,
        user,
        description: `Pay for ${order?.orderNumber || "order"}`,
      });
      setMessage("Payment successful.");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Payment failed");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <>
      <div className="shop-page-header">
        <h1 className="shop-page-title">My Payments</h1>
        <Link className="shop-btn shop-btn-outline" to="/customer/orders">
          View orders
        </Link>
      </div>
      <p className="shop-muted" style={{ marginTop: -8 }}>
        Track payment status for your orders. Pay pending COD or unpaid orders online anytime.
      </p>

      <div className="shop-stat-row">
        <div className="shop-stat-card">
          <span className="shop-muted">Paid total</span>
          <strong>₹{paidTotal}</strong>
        </div>
        <div className="shop-stat-card">
          <span className="shop-muted">Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="shop-stat-card">
          <span className="shop-muted">All payments</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      <div className="shop-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
        <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
          <option value="UPI">Pay with UPI</option>
          <option value="Card">Pay with Card</option>
          <option value="NetBanking">Pay with Net Banking</option>
          <option value="Wallet">Pay with Wallet</option>
        </select>
        <button type="button" className="shop-btn shop-btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>

      {message ? <p className="shop-muted">{message}</p> : null}
      {loading ? <p className="shop-muted">Loading payments...</p> : null}

      {!loading && !filtered.length ? (
        <div className="shop-empty">
          <h2>No payment records</h2>
          <p>Place an order to see payment details here.</p>
          <Link className="shop-btn shop-btn-primary" to="/customer/products">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="shop-panel">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => {
                const canPay =
                  order.paymentStatus === "Pending" &&
                  !["Cancelled", "Returned"].includes(order.orderStatus);

                return (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber || order._id.slice(-8)}</strong>
                      <div className="shop-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                        {order.paidAt
                          ? `Paid ${new Date(order.paidAt).toLocaleString()}`
                          : order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : ""}
                      </div>
                    </td>
                    <td>{order.paymentMethod || "—"}</td>
                    <td>₹{order.totalAmount}</td>
                    <td>
                      <span className="shop-chip">{order.paymentStatus}</span>
                    </td>
                    <td className="shop-muted" style={{ fontSize: "0.85rem" }}>
                      {order.paymentId || "—"}
                    </td>
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {canPay ? (
                        <button
                          type="button"
                          className="shop-btn shop-btn-primary"
                          style={{ padding: "8px 12px" }}
                          disabled={payingId === order._id}
                          onClick={() => payNow(order._id)}
                        >
                          {payingId === order._id ? "Paying..." : `Pay (${payMethod})`}
                        </button>
                      ) : null}
                      {canDownloadInvoice(order) ? (
                        <button
                          type="button"
                          className="shop-btn shop-btn-outline"
                          style={{ padding: "8px 12px" }}
                          disabled={invoiceId === order._id}
                          onClick={() =>
                            downloadOrderInvoice(order, {
                              onStart: () => setInvoiceId(order._id),
                              onDone: () => setInvoiceId(null),
                            })
                          }
                        >
                          {invoiceId === order._id ? "Downloading…" : "Invoice PDF"}
                        </button>
                      ) : canPay ? null : (
                        <span className="shop-muted">{order.paymentNote || "—"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            variant="shop"
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            from={from}
            to={to}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
};

export default CustomerPayments;
