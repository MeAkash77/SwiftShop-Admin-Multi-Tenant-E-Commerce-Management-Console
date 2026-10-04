import { orderApi } from "../api/services";
import { notify } from "./notify";

/**
 * Download MultiCommerce tax invoice PDF for an order.
 */
export async function downloadOrderInvoice(order, { onStart, onDone } = {}) {
  const orderId = order?._id || order;
  if (!orderId) {
    notify.error("Order not found.");
    return;
  }

  onStart?.();
  try {
    const response = await orderApi.downloadInvoice(orderId);
    const blob = new Blob([response.data], { type: "application/pdf" });
    const contentType = response.headers?.["content-type"] || "";

    if (!contentType.includes("pdf") && blob.size < 500) {
      // Likely a JSON error wrapped as blob
      const text = await blob.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.message || "Could not download invoice");
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
        throw new Error("Could not download invoice");
      }
    }

    const filename =
      `Invoice-${String(order?.orderNumber || orderId).replace(/[^\w-]+/g, "_")}.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify.success("Invoice downloaded");
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        notify.error(parsed.message || "Could not download invoice");
        return;
      } catch {
        /* fall through */
      }
    }
    notify.fromError(err, "Could not download invoice");
  } finally {
    onDone?.();
  }
}
