import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  isCrossPortal,
  multiPortalEnabled,
  openPortalInNewTab,
  portalForPathname,
  PORTAL_HOME,
  resolvePortal,
} from "../utils/portal";

/**
 * If the user navigates to another portal's routes on the wrong host/port,
 * open the correct portal in a new tab and send this tab back home.
 */
export default function PortalSwitchGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!multiPortalEnabled()) return;

    const target = portalForPathname(location.pathname);
    if (!target || !isCrossPortal(target)) return;

    const path = `${location.pathname}${location.search}${location.hash}`;
    const opened = openPortalInNewTab(target, path);
    if (!opened) return;

    const current = resolvePortal();
    const fallback = (current && PORTAL_HOME[current]) || "/";
    navigate(fallback, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
