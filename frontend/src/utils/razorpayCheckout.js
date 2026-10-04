const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay Checkout. Resolves with payment response or rejects on cancel/failure.
 */
export async function openRazorpayCheckout({
  key,
  amount,
  currency = "INR",
  orderId,
  name = "MultiCommerce",
  description = "Order payment",
  prefill = {},
  notes = {},
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Unable to load Razorpay. Check your network and try again.");
  }

  if (!key || !orderId) {
    throw new Error("Razorpay payment is not configured.");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key,
      amount,
      currency,
      name,
      description,
      order_id: orderId,
      prefill,
      notes,
      theme: { color: "#2874f0" },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });

    rzp.on("payment.failed", (response) => {
      reject(
        new Error(
          response?.error?.description ||
            response?.error?.reason ||
            "Payment failed."
        )
      );
    });

    rzp.open();
  });
}
