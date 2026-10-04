/** Shared status chip class helpers for vendor tables. */

export function orderStatusChipClass(status) {
  const key = String(status || "Pending").toLowerCase();
  return `status-chip status-chip--order-${key}`;
}

export function paymentStatusChipClass(status) {
  const key = String(status || "Pending").toLowerCase();
  return `status-chip status-chip--pay-${key}`;
}

export function productStatusChipClass(status) {
  const active = String(status || "active").toLowerCase() === "active";
  return `status-chip status-chip--${active ? "success" : "muted"}`;
}

export function productStatusLabel(status) {
  return String(status || "active").toLowerCase() === "active" ? "Active" : "Draft";
}

export function payoutStatusChipClass(status) {
  const map = {
    Requested: "status-chip--pay-pending",
    Paid: "status-chip--pay-paid",
    Rejected: "status-chip--pay-failed",
  };
  return `status-chip ${map[status] || "status-chip--muted"}`;
}

export function stockStatusChipClass(stock, low = 5) {
  const n = Number(stock || 0);
  if (n <= 0) return "status-chip status-chip--danger";
  if (n <= low) return "status-chip status-chip--warning";
  return "status-chip status-chip--success";
}

export function stockStatusLabel(stock, low = 5) {
  const n = Number(stock || 0);
  if (n <= 0) return "Out";
  if (n <= low) return "Low";
  return "OK";
}

/** Order fulfillment next steps (primary first). */
export const ORDER_NEXT_STATUSES = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped"],
  Shipped: ["Delivered"],
  Delivered: ["Returned"],
};

export const ORDER_ACTION_LABEL = {
  Confirmed: "Confirm",
  Processing: "Mark processing",
  Shipped: "Mark shipped",
  Delivered: "Mark delivered",
  Cancelled: "Cancel order",
  Returned: "Mark returned",
};

export function shortOrderLabel(order) {
  if (!order) return "—";
  if (order.orderNumber) return order.orderNumber;
  if (order._id) return String(order._id).slice(-8).toUpperCase();
  return "—";
}
