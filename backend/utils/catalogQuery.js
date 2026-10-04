/**
 * Catalog helpers — pagination, lean list shape, cache keys.
 */
const LIST_SELECT =
  "name slug brand images price discountPrice stock averageRating totalReviews isFeatured status createdAt category store shortDescription tags";

export function parsePageLimit(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10);
  const limit = Math.min(48, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 24));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function listCacheKey(parts = {}) {
  const {
    status = "",
    category = "",
    store = "",
    page = 1,
    limit = 24,
    sort = "newest",
  } = parts;
  return `catalog:list:${status}:${category}:${store}:${page}:${limit}:${sort}`;
}

export function searchCacheKey(parts = {}) {
  const {
    keyword = "",
    category = "",
    page = 1,
    limit = 24,
  } = parts;
  const kw = String(keyword).trim().toLowerCase().slice(0, 80);
  return `catalog:search:${kw}:${category}:${page}:${limit}`;
}

export function productCacheKey(id) {
  return `catalog:product:${id}`;
}

/** Strip heavy fields for card grids. */
export function toListProduct(doc) {
  if (!doc) return doc;
  const p = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    shortDescription: p.shortDescription,
    images: p.images,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
    isFeatured: p.isFeatured,
    status: p.status,
    tags: p.tags,
    createdAt: p.createdAt,
    category: p.category
      ? {
          _id: p.category._id,
          name: p.category.name,
          slug: p.category.slug,
        }
      : p.category,
    store: p.store
      ? {
          _id: p.store._id,
          storeName: p.store.storeName,
          shippingFee: p.store.shippingFee,
          freeShippingAbove: p.store.freeShippingAbove,
          estimatedDeliveryDays: p.store.estimatedDeliveryDays,
        }
      : p.store,
  };
}

export { LIST_SELECT };
