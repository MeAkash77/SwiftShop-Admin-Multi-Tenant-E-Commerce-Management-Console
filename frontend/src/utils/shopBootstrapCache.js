/**
 * Instant shop UI on reload/first paint — show last good catalog while APIs refresh.
 * Stored in localStorage so a hard reload still paints in &lt;100ms when cache is fresh.
 */

const PREFIX = "mc_shop_v2:";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function storage() {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function readShopCache(key) {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (Date.now() - Number(parsed.at || 0) > MAX_AGE_MS) {
      store.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeShopCache(key, data) {
  const store = storage();
  if (!store || data == null) return;
  try {
    store.setItem(
      PREFIX + key,
      JSON.stringify({ at: Date.now(), data })
    );
  } catch {
    // quota / private mode — ignore
  }
}

export const SHOP_CACHE_KEYS = {
  home: "home_bootstrap",
  categories: "categories",
  products: (q) => `products:${q}`,
};

export default { readShopCache, writeShopCache, SHOP_CACHE_KEYS };
