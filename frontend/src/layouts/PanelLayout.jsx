import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/user/userSlice";
import apiInstance from "../api/apiInstaince";
import SidebarNav from "../components/SidebarNav";
import "./PanelLayout.css";

const PanelLayout = ({
  brandTitle,
  brandSubtitle,
  brandIcon,
  menuItems,
  homePath,
  logoutPath = "/login",
  logoutEndpoint = "/auth/logout",
  theme = "dark",
  onThemeToggle,
  settingsPath,
  shellClassName = "",
  outletContext,
  topbarCenter = null,
  topbarLeadingActions = null,
  homeLabel = "Home",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user.user);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleLogout() {
    try {
      await apiInstance.post(logoutEndpoint);
    } catch {
      // ignore
    } finally {
      dispatch(logout());
      navigate(logoutPath);
    }
  }

  const shellTheme =
    theme === "light" ? "panel-shell--light" : "panel-shell--dark";

  return (
    <div
      className={`panel-shell ${shellTheme} ${shellClassName}`.trim()}
      data-theme={theme}
    >
      {navOpen ? (
        <button
          type="button"
          className="panel-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside className={`panel-sidebar${navOpen ? " is-open" : ""}`}>
        <div className="panel-brand">
          {brandIcon ? (
            <div className="panel-brand-mark" aria-hidden="true">
              <i className={brandIcon} />
            </div>
          ) : null}
          <div className="panel-brand-text">
            <h1>{brandTitle}</h1>
            <p>{brandSubtitle}</p>
          </div>
        </div>
        <SidebarNav menuItems={menuItems} cartCount={cartCount} />
      </aside>

      <div className="panel-main">
        <header className="panel-topbar">
          <div className="panel-topbar-left">
            <button
              type="button"
              className="panel-nav-toggle"
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <i className={`fa-solid ${navOpen ? "fa-xmark" : "fa-bars"}`} />
            </button>
            <div className="panel-topbar-identity">
              <p className="panel-greeting">Signed in as</p>
              <h2>
                {user?.firstName || "User"} {user?.lastName || ""}
              </h2>
            </div>
          </div>
          {topbarCenter ? (
            <div className="panel-topbar-center">{topbarCenter}</div>
          ) : null}
          <div className="panel-actions">
            {topbarLeadingActions}
            {typeof onThemeToggle === "function" ? (
              <button
                type="button"
                className="panel-icon-btn"
                onClick={onThemeToggle}
                title={theme === "light" ? "Switch to dark" : "Switch to light"}
                aria-label={
                  theme === "light"
                    ? "Switch to dark theme"
                    : "Switch to light theme"
                }
              >
                <i
                  className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}
                  aria-hidden="true"
                />
              </button>
            ) : null}
            {settingsPath ? (
              <Link
                className="panel-icon-btn"
                to={settingsPath}
                title="Settings"
                aria-label="Settings"
              >
                <i className="fa-solid fa-gear" aria-hidden="true" />
              </Link>
            ) : null}
            <button
              type="button"
              className="panel-ghost panel-action-label"
              onClick={() => navigate(homePath)}
            >
              {homeLabel}
            </button>
            <button
              type="button"
              className="panel-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>
        <main className="panel-content">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
};

export default PanelLayout;
