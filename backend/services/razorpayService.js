import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const isRazorpayConfigured = () => Boolean(keyId && keySecret);

let razorpayClient = null;

function getClient() {
  if (!isRazorpayConfigured()) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
    );
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClient;
}

/** Amount in INR rupees → paise for Razorpay */
export async function createRazorpayOrder({ amount, receipt, notes = {} }) {
  const client = getClient();
  const amountPaise = Math.round(Number(amount) * 100);

  if (!amountPaise || amountPaise < 100) {
    throw new Error("Order amount must be at least ₹1 for Razorpay.");
  }

  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: String(receipt).slice(0, 40),
    notes,
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
  };
}

export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured.");
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expected === razorpaySignature;
}

/** Fetch payment from Razorpay to confirm amount / order binding */
export async function fetchRazorpayPayment(paymentId) {
  const client = getClient();
  return client.payments.fetch(paymentId);
}

export function getRazorpayKeyId() {
  return keyId || null;
}
