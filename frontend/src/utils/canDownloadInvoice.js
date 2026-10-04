/**
 * Tax invoice is available only after delivery.
 * Cancelled / Returned orders never get an invoice download.
 */
export function canDownloadInvoice(order) {
  if (!order) return false;
  const status = order.orderStatus;
  if (status === "Cancelled" || status === "Returned") return false;
  return status === "Delivered";
}
