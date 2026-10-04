import { getRefreshMaxAgeMs } from "./generateToken.js";

/**
 * Cookie options for refresh tokens.
 * Cross-origin Vercel frontends need secure + SameSite=None.
 *
 * Cookie names are portal-scoped so customer / vendor / admin sessions
 * can stay logged in at the same time (multi-port / multi-tab).
 * Legacy name "refreshToken" is still accepted when reading.
 */
export const REFRESH_COOKIE = {
  customer: "refreshToken_customer",
  vendor: "refreshToken_vendor",
  admin: "refreshToken_admin",
};

const VALID_PORTALS = new Set(["customer", "vendor", "admin"]);

export function normalizePortal(portal) {
  if (VALID_PORTALS.has(portal)) return portal;
  return "customer";
}

export function refreshCookieName(portal = "customer") {
  return REFRESH_COOKIE[normalizePortal(portal)];
}

export function getRefreshCookieOptions() {
  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: getRefreshMaxAgeMs(),
    path: "/",
  };
}

export function setRefreshCookie(res, token, portal = "customer") {
  const opts = getRefreshCookieOptions();
  res.cookie(refreshCookieName(portal), token, opts);
  // Drop legacy shared cookie so it cannot overwrite another portal session
  res.clearCookie("refreshToken", opts);
}

export function readRefreshCookie(req, portal = "customer") {
  const named = req.cookies?.[refreshCookieName(portal)];
  if (named) return named;
  // Fallback: legacy shared cookie (older clients)
  return req.cookies?.refreshToken || null;
}

export function clearRefreshCookie(res, portal = "customer") {
  const opts = getRefreshCookieOptions();
  res.clearCookie(refreshCookieName(portal), opts);
  res.clearCookie("refreshToken", opts);
}
