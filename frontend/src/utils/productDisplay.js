/** Shared pricing helpers for Flipkart-style cards and PDP. */
export function getProductPricing(product) {
  const list = Number(product?.price) || 0;
  const sale = Number(product?.discountPrice) || 0;
  const hasDiscount = sale > 0 && list > 0 && sale < list;
  const price = hasDiscount ? sale : sale > 0 ? sale : list;
  const mrp = hasDiscount ? list : list || price;
  const offer =
    mrp > price && price > 0 ? Math.max(1, Math.round(((mrp - price) / mrp) * 100)) : 0;
  return { price, mrp: mrp || price, offer };
}

/**
 * Resolve price for a selected product version (color/storage/…).
 * Variant MRP → price, variant selling → discountPrice; empty fields fall back to product.
 */
export function getVariantPricing(product, variant) {
  if (!variant) return getProductPricing(product);

  const base = getProductPricing(product);
  const vMrp = Number(variant.price) || 0;
  const vSell = Number(variant.discountPrice) || 0;

  if (!vMrp && !vSell) return base;

  return getProductPricing({
    price: vMrp || product?.price || vSell,
    discountPrice: vSell || undefined,
  });
}

export function getProductRating(product) {
  const average = Number(product?.averageRating) || 0;
  const total = Number(product?.totalReviews) || 0;
  return { average, total };
}
