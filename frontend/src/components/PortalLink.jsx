import { Link } from "react-router-dom";
import { isCrossPortal, portalUrl, PORTAL_HOME } from "../utils/portal";

/**
 * Link that opens another portal on its own host/port in a new tab
 * when multi-portal mode is active; otherwise a normal in-app Link.
 */
export default function PortalLink({
  portal,
  to,
  children,
  className,
  ...rest
}) {
  const path = to || PORTAL_HOME[portal] || "/";

  if (isCrossPortal(portal)) {
    return (
      <a
        href={portalUrl(portal, path)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={path} className={className} {...rest}>
      {children}
    </Link>
  );
}
