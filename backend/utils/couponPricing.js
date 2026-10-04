/**
 * Pure coupon math — shared by order create and unit smoke tests.
 */

/**
 * @param {{ type: string, value: number, minOrder?: number }} coupon
 * @param {number} subtotal
 * @returns {number} discount amount (never exceeds subtotal)
 */
export function computeCouponDiscount(coupon, subtotal) {
  const amount = Number(subtotal) || 0;
  const minOrder = Number(coupon.minOrder) || 0;

  if (amount < minOrder) {
    throw new Error(
      `Order subtotal must be at least ₹${minOrder} to use this coupon.`
    );
  }

  let discount = 0;
  if (coupon.type === "percent") {
    const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0));
    discount = (amount * pct) / 100;
  } else {
    discount = Math.max(0, Number(coupon.value) || 0);
  }

  return Number(Math.min(discount, amount).toFixed(2));
}

/**
 * @param {object} store
 * @param {number} merchandiseSubtotal — before coupon
 * @returns {number}
 */
export function computeShippingFee(store, merchandiseSubtotal) {
  let fee = Number(store?.shippingFee) || 0;
  const threshold = store?.freeShippingAbove;
  if (
    threshold != null &&
    threshold !== "" &&
    Number(merchandiseSubtotal) >= Number(threshold)
  ) {
    fee = 0;
  }
  return Number(fee.toFixed(2));
}
