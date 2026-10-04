import { orderApi } from "../api/services";
import { openRazorpayCheckout } from "./razorpayCheckout";

/** Start Razorpay checkout and verify payment on the server. */
export async function completeRazorpayPayment({
  order,
  razorpay,
  user,
  description,
}) {
  if (!razorpay?.orderId || !razorpay?.key) {
    throw new Error("Razorpay session missing. Try again.");
  }

  const payment = await openRazorpayCheckout({
    key: razorpay.key,
    amount: razorpay.amount,
    currency: razorpay.currency || "INR",
    orderId: razorpay.orderId,
    description: description || `Payment for ${order.orderNumber || "order"}`,
    prefill: {
      name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
      email: user?.email,
    },
    notes: {
      orderId: String(order._id),
    },
  });

  const verified = await orderApi.verifyPayment({
    orderId: order._id,
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
  });

  return verified.data?.data || verified.data;
}
