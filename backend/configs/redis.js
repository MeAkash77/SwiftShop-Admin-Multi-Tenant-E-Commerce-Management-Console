/**
 * Catalog cache: Redis when REDIS_URL is set, else in-process memory TTL.
 * Memory cache keeps warm Vercel/Docker instances under ~300ms for hot keys.
 */
import Redis from "ioredis";

let client = null;
let status = "memory";

const memory = new Map();
const MEMORY_MAX_KEYS = 500;

function memGet(key) {
  const row = memory.get(key);
  if (!row) return null;
  if (row.expiresAt && Date.now() > row.expiresAt) {
    memory.delete(key);
    return null;
  }
  return row.value;
}

function memSet(key, value, ttlSeconds = 60) {
  if (memory.size >= MEMORY_MAX_KEYS) {
    const first = memory.keys().next().value;
    if (first != null) memory.delete(first);
  }
  memory.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
  });
}

function memDel(...keys) {
  let n = 0;
  for (const key of keys) {
    if (memory.delete(key)) n += 1;
  }
  return n;
}

function memDelPattern(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const re = new RegExp(`^${escaped}$`);
  let n = 0;
  for (const key of [...memory.keys()]) {
    if (re.test(key)) {
      memory.delete(key);
      n += 1;
    }
  }
  return n;
}

function getClient() {
  const url = String(process.env.REDIS_URL || "").trim();
  if (!url) {
    status = "memory";
    return null;
  }
  if (client) return client;

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 4000,
    });
    client.on("connect", () => {
      status = "connected";
    });
    client.on("ready", () => {
      status = "connected";
    });
    client.on("error", (err) => {
      status = "error";
      console.warn("[redis]", err.message);
    });
    client.on("end", () => {
      status = "disconnected";
    });
    return client;
  } catch (err) {
    status = "error";
    console.warn("[redis] init failed:", err.message);
    client = null;
    return null;
  }
}

export function redisStatus() {
  getClient();
  return status;
}

export async function cacheGet(key) {
  const hit = memGet(key);
  if (hit != null) return hit;

  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    // hydrate memory so next warm hit is instant
    memSet(key, value, 30);
    return value;
  } catch (err) {
    console.warn("[redis] get failed:", err.message);
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  memSet(key, value, ttlSeconds);
  const redis = getClient();
  if (!redis) return true;
  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.set(key, payload, "EX", ttlSeconds);
    } else {
      await redis.set(key, payload);
    }
    return true;
  } catch (err) {
    console.warn("[redis] set failed:", err.message);
    return true; // memory already set
  }
}

export async function cacheDel(...keys) {
  memDel(...keys);
  const redis = getClient();
  if (!redis || !keys.length) return keys.length;
  try {
    return await redis.del(...keys);
  } catch (err) {
    console.warn("[redis] del failed:", err.message);
    return 0;
  }
}

export async function cacheDelPattern(pattern) {
  memDelPattern(pattern);
  const redis = getClient();
  if (!redis) return 0;
  let deleted = 0;
  try {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      if (keys.length) {
        deleted += await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    console.warn("[redis] delPattern failed:", err.message);
  }
  return deleted;
}

export async function invalidateCatalogCache(productId) {
  await cacheDelPattern("catalog:list:*");
  await cacheDelPattern("catalog:search:*");
  await cacheDelPattern("categories:*");
  if (productId) {
    await cacheDel(`catalog:product:${productId}`);
  }
}

/** Public browse responses — CDN + browser short TTL for &lt;300ms repeats. */
export function setPublicCatalogHeaders(res, { hit = false, maxAge = 30 } = {}) {
  res.setHeader("X-Cache", hit ? "HIT" : "MISS");
  res.setHeader(
    "Cache-Control",
    `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  );
  res.setHeader("CDN-Cache-Control", `public, s-maxage=${maxAge}`);
  res.setHeader("Vercel-CDN-Cache-Control", `public, s-maxage=${maxAge}`);
}

export default {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  invalidateCatalogCache,
  redisStatus,
  setPublicCatalogHeaders,
};
