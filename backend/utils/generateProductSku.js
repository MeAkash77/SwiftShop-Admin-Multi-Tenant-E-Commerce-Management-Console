/**
 * Build a human-readable SKU from product details.
 * Example: NIKE-AIRMAX-BLK-M-K7Q2
 */
function slugPart(value, maxLen = 10) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, maxLen);
}

function colorCode(color) {
  const map = {
    black: "BLK",
    white: "WHT",
    red: "RED",
    blue: "BLU",
    green: "GRN",
    yellow: "YLW",
    orange: "ORG",
    pink: "PNK",
    purple: "PRP",
    grey: "GRY",
    gray: "GRY",
    brown: "BRN",
    gold: "GLD",
    silver: "SLV",
  };
  const key = String(color || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  if (map[key]) return map[key];
  return slugPart(key, 4);
}

function sizeCode(size) {
  const key = String(size || "")
    .trim()
    .toUpperCase();
  if (!key) return "";
  return key.replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

function uniqueSuffix() {
  return Date.now().toString(36).toUpperCase().slice(-4);
}

export function generateProductSku({
  name,
  brand,
  storeId,
  color,
  size,
  variants = [],
} = {}) {
  const brandPart = slugPart(brand, 6) || "PRD";
  const namePart =
    slugPart(name, 12) ||
    slugPart(String(storeId || "").slice(-4), 4) ||
    "ITEM";

  const firstVariant = Array.isArray(variants) ? variants[0] : null;
  const colorPart = colorCode(color || firstVariant?.color);
  const sizePart = sizeCode(size || firstVariant?.size);

  const parts = [brandPart, namePart, colorPart, sizePart, uniqueSuffix()].filter(
    Boolean
  );

  return parts.join("-").slice(0, 48);
}

export function generateProductSlug(name) {
  const base = String(name || "product")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "product"}-${Date.now().toString(36)}`;
}

/**
 * Ensure SKU is unique in the Product collection.
 */
export async function ensureUniqueSku(Product, baseSku) {
  let sku = baseSku;
  let attempt = 0;
  while (await Product.exists({ sku })) {
    attempt += 1;
    sku = `${baseSku}-${attempt}`;
    if (attempt > 20) {
      sku = `${baseSku}-${Date.now().toString(36).toUpperCase()}`;
      break;
    }
  }
  return sku;
}
