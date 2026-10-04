const KEY = "multicommerce_recently_viewed";
const MAX = 12;

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Persist a slim product snapshot for home “continue shopping”. */
export function pushRecentlyViewed(product) {
  if (!product?._id) return;
  const entry = {
    productId: product._id,
    name: product.name,
    price: product.discountPrice > 0 ? product.discountPrice : product.price,
    mrp: product.price,
    image: product.images?.[0]?.url || null,
    averageRating: product.averageRating || 0,
    viewedAt: Date.now(),
  };
  const prev = getRecentlyViewed().filter((p) => p.productId !== entry.productId);
  const next = [entry, ...prev].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}
