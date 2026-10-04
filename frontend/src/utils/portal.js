/**
 * Portal resolution — works in dev (multi-port) AND production (subdomains / origins).
 *
 * A "portal" is one of: "customer" | "vendor" | "admin".
 *
 * Resolution order for which portal THIS host serves (first match):
 *   1. Build-time env  VITE_PORTAL
 *   2. Dev-only env    VITE_DEV_PORTAL
 *   3. Hostname subdomain: vendor.example.com -> "vendor"
 *
 * Cross-portal URLs (open other portal in a new tab):
 *   - Dev ports: customer 5173 · vendor 5174 · admin 5175
 *   - Or set VITE_CUSTOMER_ORIGIN / VITE_VENDOR_ORIGIN / VITE_ADMIN_ORIGIN
 *   - Or subdomains: vendor.example.com, admin.example.com
 */

export const PORTAL_HOME = {
  customer: "/customer",
  vendor: "/vendor/login",
  admin: "/admin/login",
};

export const PORTAL_LABEL = {
  customer: "Customer shop",
  vendor: "Vendor workspace",
  admin: "Admin panel",
};

const VALID = new Set(["customer", "vendor", "admin"]);

const DEV_PORTS = {
  customer: 5173,
  vendor: 5174,
  admin: 5175,
};

const ORIGIN_ENV = {
  customer: "VITE_CUSTOMER_ORIGIN",
  vendor: "VITE_VENDOR_ORIGIN",
  admin: "VITE_ADMIN_ORIGIN",
};

function fromEnv() {
  const build = import.meta.env.VITE_PORTAL;
  if (VALID.has(build)) return build;

  if (import.meta.env.DEV) {
    const dev = import.meta.env.VITE_DEV_PORTAL;
    if (VALID.has(dev)) return dev;
  }
  return null;
}

function fromHostname() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname || "";
  const sub = host.split(".")[0];
  if (VALID.has(sub)) return sub;
  return null;
}

/** Returns "customer" | "vendor" | "admin" | null (null = show full app). */
export function resolvePortal() {
  return fromEnv() || fromHostname() || null;
}

/** Which portal a pathname belongs to. */
export function portalForPathname(pathname = "") {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/vendor")) return "vendor";
  if (
    pathname.startsWith("/customer") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/resetPassword") ||
    pathname.startsWith("/verify-email")
  ) {
    return "customer";
  }
  return null;
}

function envOrigin(portal) {
  const key = ORIGIN_ENV[portal];
  const raw = key ? import.meta.env[key] : "";
  return String(raw || "")
    .trim()
    .replace(/\/$/, "");
}

/**
 * Absolute origin for a portal, or null when same-origin path routing is enough.
 */
export function getPortalOrigin(portal) {
  if (!VALID.has(portal)) return null;

  const configured = envOrigin(portal);
  if (configured) return configured;

  if (typeof window === "undefined") return null;

  const { protocol, hostname } = window.location;
  const parts = hostname.split(".");

  // Production: currently on a portal subdomain → swap first label
  if (parts.length >= 2 && VALID.has(parts[0])) {
    const base = parts.slice(1).join(".");
    return `${protocol}//${portal}.${base}`;
  }

  // Dev multi-port (only when a portal mode is active)
  if (import.meta.env.DEV && resolvePortal()) {
    const port = DEV_PORTS[portal];
    return `${protocol}//${hostname}:${port}`;
  }

  return null;
}

/** True when other portals live on different origins (multi-port / multi-host). */
export function multiPortalEnabled() {
  if (
    envOrigin("customer") ||
    envOrigin("vendor") ||
    envOrigin("admin")
  ) {
    return true;
  }
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_PORTAL) return true;
  if (fromHostname()) return true;
  return false;
}

export function isCrossPortal(portal) {
  if (!multiPortalEnabled()) return false;
  const origin = getPortalOrigin(portal);
  if (!origin || typeof window === "undefined") return false;
  return origin !== window.location.origin;
}

/** Full URL when cross-portal; otherwise a same-app path. */
export function portalUrl(portal, path) {
  const p = path || PORTAL_HOME[portal] || "/";
  const normalized = p.startsWith("/") ? p : `/${p}`;
  if (isCrossPortal(portal)) {
    return `${getPortalOrigin(portal)}${normalized}`;
  }
  return normalized;
}

/** Open another portal in a new tab. Returns true if a cross-portal jump happened. */
export function openPortalInNewTab(portal, path) {
  if (!isCrossPortal(portal)) return false;
  const url = portalUrl(portal, path);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  // Popup blocked (e.g. no user gesture) — switch this tab instead
  if (!win) {
    window.location.assign(url);
  }
  return true;
}
