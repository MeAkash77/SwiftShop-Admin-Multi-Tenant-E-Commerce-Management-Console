import { Navigate } from "react-router-dom";
import { resolvePortal, PORTAL_HOME } from "../utils/portal";

/**
 * Sends "/" to the active portal's landing page.
 * Works in dev (multi-port) and production (per-deployment env or subdomain).
 * Falls back to the full customer home when no portal is active.
 */
export default function DevPortalHome({ Home }) {
  const portal = resolvePortal();
  const target = PORTAL_HOME[portal];

  if (target) {
    return <Navigate to={target} replace />;
  }

  return <Home />;
}
