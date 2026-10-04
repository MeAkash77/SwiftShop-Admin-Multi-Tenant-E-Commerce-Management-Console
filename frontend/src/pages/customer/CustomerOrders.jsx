import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { orderApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import { completeRazorpayPayment } from "../../utils/completeRazorpayPayment";
import { downloadOrderInvoice } from "../../utils/downloadOrderInvoice";
import { canDownloadInvoice } from "../../utils/canDownloadInvoice";
import { addToCart } from "../../features/cart/cartSlice";
import { notify } from "../../utils/notify";
import { OrderListSkeleton } from "../../components/shop/LoadingStates";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "to_pay", label: "To pay" },
  { id: "active", label: "In progress" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Returned", label: "Returned" },
];

const TRACK_STEPS = [
  { id: "placed", label: "Ordered", match: ["Pending", "Confirmed"] },
  { id: "packed", label: "Packed", match: ["Processing"] },
  { id: "shipped", label: "Shipped", match: ["Shipped"] },
  { id: "delivered", label: "Delivered", match: ["Delivered"] },
];

function statusHeadline(order) {
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "";

  if (order.paymentStatus === "Refunded") {
    return { text: "Refunded", tone: "info", hint: "A refund was issued for this order." };
  }
  if (order.orderStatus === "Cancelled") {
    return { text: "Cancelled", tone: "danger", hint: "This order was cancelled." };
  }
  if (order.orderStatus === "Returned") {
    return { text: "Returned", tone: "danger", hint: "Return completed." };
  }
  if (order.orderStatus === "Delivered") {
    return {
      text: `Delivered${date ? ` · ${date}` : ""}`,
      tone: "success",
      hint: "Your order was delivered.",
    };
  }
  if (order.orderStatus === "Shipped") {
    return { text: "On the way", tone: "info", hint: "Your package is in transit." };
  }
  if (order.orderStatus === "Processing") {
    return { text: "Packing", tone: "info", hint: "Seller is preparing your items." };
  }
  if (
    order.paymentStatus === "Pending" &&
    order.paymentMethod !== "COD" &&
    !["Cancelled", "Returned"].includes(order.orderStatus)
  ) {
    return {
      text: "Payment pending",
      tone: "warn",
      hint: "Pay to confirm this order.",
    };
  }
  if (order.orderStatus === "Confirmed" || order.orderStatus === "Pending") {
    return {
      text: "Confirmed",
      tone: "ok",
      hint: "Seller will pack your items next.",
    };
  }
  return { text: order.orderStatus || "Order", tone: "ok", hint: "" };
}

function formatMoney(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAddress(addr) {
  if (!addr) return "";
  return `${addr.addressLine}, ${addr.locality}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
}

function productFromItem(item) {
  return item?.productId && typeof item.productId === "object" ? item.productId : null;
}

function productImage(product) {
  return product?.images?.[0]?.url || null;
}

function trackIndex(orderStatus) {
  if (["Cancelled", "Returned"].includes(orderStatus)) return -1;
  const idx = TRACK_STEPS.findIndex((step) => step.match.includes(orderStatus));
  return idx >= 0 ? idx : 0;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify.success("Order ID copied");
  } catch {
    notify.error("Could not copy");
  }
}

const CustomerOrders = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await orderApi.byCustomer(user.id);
      setOrders(response.data?.data || response.data || []);
    } catch (err) {
      notify.fromError(err, "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const closed = ["Cancelled", "Returned"].includes(order.orderStatus);
      const needsPay =
        order.paymentStatus === "Pending" && !closed && order.paymentMethod !== "COD";

      if (filter === "to_pay") {
        if (!needsPay) return false;
      } else if (filter === "active") {
        const inProgress = ["Confirmed", "Processing", "Shipped"].includes(order.orderStatus);
        const codPending =
          order.orderStatus === "Pending" && order.paymentMethod === "COD";
        if (!inProgress && !codPending) return false;
      } else if (filter !== "all" && order.orderStatus !== filter) {
        return false;
      }

      if (!q) return true;
      const orderNo = String(order.orderNumber || "").toLowerCase();
      const storeName = String(order.storeId?.storeName || "").toLowerCase();
      const productHit = (order.items || []).some((item) => {
        const product = productFromItem(item);
        return String(product?.name || "")
          .toLowerCase()
          .includes(q);
      });
      return orderNo.includes(q) || storeName.includes(q) || productHit;
    });
  }, [orders, filter, query]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(
    filtered,
    { pageSize: 8, resetKey: `${filter}:${query}` }
  );

  async function cancel(orderId) {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await orderApi.cancel(orderId);
      notify.success("Order cancelled.");
      await load();
    } catch (err) {
      notify.fromError(err, "Cancel failed");
    }
  }

  async function returnOrder(orderId) {
    if (!window.confirm("Request a return? The seller will process any refund.")) return;
    try {
      await orderApi.returnOrder(orderId);
      notify.success("Return requested.");
      await load();
    } catch (err) {
      notify.fromError(err, "Return failed");
    }
  }

  async function payNow(orderId) {
    setPayingId(orderId);
    try {
      const response = await orderApi.pay(orderId, "UPI");
      const order = response.data?.data;
      const razorpay = response.data?.razorpay;
      await completeRazorpayPayment({
        order,
        razorpay,
        user,
        description: `Pay for ${order?.orderNumber || "order"}`,
      });
      notify.success("Payment successful.");
      await load();
    } catch (err) {
      notify.fromError(err, "Payment failed");
    } finally {
      setPayingId(null);
    }
  }

  async function downloadInvoice(order) {
    await downloadOrderInvoice(order, {
      onStart: () => setInvoiceId(order._id),
      onDone: () => setInvoiceId(null),
    });
  }

  function buyAgain(order) {
    let added = 0;
    for (const item of order.items || []) {
      const product = productFromItem(item);
      const productId = product?._id || item.productId;
      if (!productId) continue;
      dispatch(
        addToCart({
          productId: String(productId),
          name: product?.name || "Product",
          price: Number(item.price || product?.price || 0),
          image: productImage(product),
          storeId: order.storeId?._id || order.storeId,
          stock: 99,
          quantity: Number(item.quantity || 1),
          options: item.options || undefined,
          variantLabel: item.variantLabel || undefined,
        })
      );
      added += 1;
    }
    if (added) notify.success(`Added ${added} item${added === 1 ? "" : "s"} to cart`);
    else notify.error("Could not add items.");
  }

  return (
    <div className="co-page">
      <header className="co-header">
        <div>
          <h1>My Orders</h1>
          <p>Track, pay, or buy again.</p>
        </div>
        <Link className="shop-btn shop-btn-primary" to="/customer/products">
          Continue shopping
        </Link>
      </header>

      <label className="co-search">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders"
          aria-label="Search orders"
        />
        {query ? (
          <button type="button" className="co-search-clear" onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </label>

      <div className="co-filters" role="tablist" aria-label="Filter orders">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`co-filter ${filter === item.id ? "is-active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <OrderListSkeleton count={4} />
      ) : !orders.length ? (
        <div className="co-empty">
          <div className="co-empty-icon" aria-hidden="true">
            <i className="fa-solid fa-box-open" />
          </div>
          <h2>No orders yet</h2>
          <p>Your orders will show up here after you buy something.</p>
          <Link className="shop-btn shop-btn-primary" to="/customer/products">
            Start shopping
          </Link>
        </div>
      ) : !filtered.length ? (
        <div className="co-empty">
          <h2>No matching orders</h2>
          <button
            type="button"
            className="shop-btn shop-btn-outline"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <p className="co-result-count">
            {from}–{to} of {totalItems}
          </p>

          <div className="co-list">
            {pageItems.map((order) => {
              const items = order.items || [];
              const first = items[0];
              const product = productFromItem(first);
              const name = product?.name || "Product";
              const image = productImage(product);
              const productId = product?._id || first?.productId;
              const extra = Math.max(0, items.length - 1);
              const canPay =
                order.paymentStatus === "Pending" &&
                order.paymentMethod !== "COD" &&
                !["Cancelled", "Returned"].includes(order.orderStatus);
              const canCancel = ["Pending", "Confirmed"].includes(order.orderStatus);
              const canReturn = order.orderStatus === "Delivered";
              const canInvoice = canDownloadInvoice(order);
              const expanded = expandedId === order._id;
              const activeStep = trackIndex(order.orderStatus);
              const ship = order.shippingAddress;
              const orderNo = order.orderNumber || String(order._id).slice(-8);
              const storeName = order.storeId?.storeName || "Store";
              const storeId = order.storeId?._id || order.storeId;
              const headline = statusHeadline(order);

              return (
                <article className="co-card" key={order._id}>
                  <div className={`co-status co-status--${headline.tone}`}>
                    <i
                      className={`fa-solid ${
                        headline.tone === "success"
                          ? "fa-circle-check"
                          : headline.tone === "danger"
                            ? "fa-circle-xmark"
                            : headline.tone === "warn"
                              ? "fa-clock"
                              : "fa-truck-fast"
                      }`}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{headline.text}</strong>
                      {headline.hint ? <p>{headline.hint}</p> : null}
                    </div>
                  </div>

                  <div className="co-body">
                    <Link
                      className="co-thumb"
                      to={productId ? `/customer/products/${productId}` : "/customer/products"}
                    >
                      {image ? <img src={image} alt={name} /> : <span>No image</span>}
                    </Link>

                    <div className="co-info">
                      <Link
                        className="co-title"
                        to={productId ? `/customer/products/${productId}` : "/customer/products"}
                      >
                        {name}
                        {extra > 0 ? ` +${extra} more` : ""}
                      </Link>
                      <p className="co-meta">
                        {first?.quantity ? `Qty ${first.quantity}` : null}
                        {first?.variantLabel ? ` · ${first.variantLabel}` : null}
                        {" · "}
                        {formatMoney(order.totalAmount)}
                      </p>
                      <p className="co-meta">
                        {storeId ? (
                          <Link to={`/customer/stores/${storeId}`}>{storeName}</Link>
                        ) : (
                          storeName
                        )}
                        {" · "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="co-actions">
                    {canPay ? (
                      <button
                        type="button"
                        className="shop-btn shop-btn-primary"
                        disabled={payingId === order._id}
                        onClick={() => payNow(order._id)}
                      >
                        {payingId === order._id ? "Paying…" : "Pay now"}
                      </button>
                    ) : order.orderStatus === "Delivered" ||
                      order.orderStatus === "Cancelled" ||
                      order.orderStatus === "Returned" ? (
                      <button
                        type="button"
                        className="shop-btn shop-btn-outline"
                        onClick={() => buyAgain(order)}
                      >
                        Buy again
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className="shop-btn shop-btn-outline"
                      onClick={() => setExpandedId(expanded ? null : order._id)}
                    >
                      {expanded ? "Hide details" : "View details"}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="co-details">
                      {activeStep >= 0 ? (
                        <div className="co-track" aria-label="Order progress">
                          {TRACK_STEPS.map((step, index) => {
                            const done = activeStep >= index;
                            const current = activeStep === index;
                            return (
                              <div
                                key={step.id}
                                className={`co-track-step ${done ? "is-done" : ""} ${
                                  current ? "is-current" : ""
                                }`}
                              >
                                <i />
                                <span>{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="co-details-row">
                        <span>Order ID</span>
                        <strong>
                          #{orderNo}{" "}
                          <button
                            type="button"
                            className="co-link-btn"
                            onClick={() => copyText(orderNo)}
                          >
                            Copy
                          </button>
                        </strong>
                      </div>
                      <div className="co-details-row">
                        <span>Payment</span>
                        <strong>
                          {order.paymentMethod || "—"} · {order.paymentStatus}
                        </strong>
                      </div>
                      {order.paymentNote ? (
                        <div className="co-details-row">
                          <span>Note</span>
                          <strong>{order.paymentNote}</strong>
                        </div>
                      ) : null}
                      <div className="co-details-row">
                        <span>Address</span>
                        <strong>
                          {ship
                            ? `${ship.fullName} · ${ship.phone} · ${formatAddress(ship)}`
                            : "Not available"}
                        </strong>
                      </div>

                      {items.length > 1 ? (
                        <ul className="co-details-items">
                          {items.map((item) => {
                            const p = productFromItem(item);
                            const n = p?.name || "Product";
                            const pid = p?._id || item.productId;
                            return (
                              <li key={item._id || `${pid}-${item.variantLabel}`}>
                                {pid ? (
                                  <Link to={`/customer/products/${pid}`}>{n}</Link>
                                ) : (
                                  n
                                )}
                                <span>
                                  {formatMoney(item.price)} × {item.quantity}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}

                      <div className="co-details-actions">
                        {canInvoice ? (
                          <button
                            type="button"
                            className="shop-btn shop-btn-ghost"
                            disabled={invoiceId === order._id}
                            onClick={() => downloadInvoice(order)}
                          >
                            Invoice
                          </button>
                        ) : null}
                        {canCancel ? (
                          <button
                            type="button"
                            className="shop-btn shop-btn-ghost"
                            onClick={() => cancel(order._id)}
                          >
                            Cancel order
                          </button>
                        ) : null}
                        {canReturn ? (
                          <button
                            type="button"
                            className="shop-btn shop-btn-ghost"
                            onClick={() => returnOrder(order._id)}
                          >
                            Return
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="shop-btn shop-btn-ghost"
                          onClick={() => document.querySelector(".mc-chat-fab")?.click()}
                        >
                          Help
                        </button>
                        {!canPay &&
                        order.orderStatus !== "Delivered" &&
                        order.orderStatus !== "Cancelled" &&
                        order.orderStatus !== "Returned" ? (
                          <button
                            type="button"
                            className="shop-btn shop-btn-ghost"
                            onClick={() => buyAgain(order)}
                          >
                            Buy again
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <Pagination
            variant="shop"
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
  );
};

export default CustomerOrders;
