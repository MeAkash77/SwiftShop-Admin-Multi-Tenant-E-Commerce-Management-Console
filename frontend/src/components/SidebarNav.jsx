import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./SidebarNav.css";

function isMenuLinkActive(item, location) {
  const target = new URL(String(item.to || ""), "http://sidebar.local");
  const pathMatches = item.end
    ? location.pathname === target.pathname
    : location.pathname === target.pathname ||
      location.pathname.startsWith(`${target.pathname}/`);

  if (!pathMatches) return false;

  const searchRules =
    item.activeSearch ||
    (target.search
      ? Object.fromEntries(target.searchParams.entries())
      : null);

  if (!searchRules) return true;

  const currentParams = new URLSearchParams(location.search);
  return Object.entries(searchRules).every(([key, value]) =>
    value === null
      ? !currentParams.has(key)
      : currentParams.get(key) === String(value)
  );
}

/**
 * menuItems shape:
 * - link: { type?: "link", to, label, icon, end?, showCartBadge? }
 * - group: { type: "group", id, label, icon, children: link[] }
 */
const SidebarNav = ({ menuItems = [], cartCount = 0 }) => {
  const location = useLocation();

  const activeGroupIds = useMemo(() => {
    const ids = new Set();
    menuItems.forEach((item) => {
      if (item.type !== "group") return;
      const match = item.children?.some((child) =>
        isMenuLinkActive(child, location)
      );
      if (match) ids.add(item.id);
    });
    return ids;
  }, [location, menuItems]);

  const [openGroups, setOpenGroups] = useState(() => activeGroupIds);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      activeGroupIds.forEach((id) => next.add(id));
      return next;
    });
  }, [activeGroupIds]);

  function toggleGroup(id) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderLink(item) {
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={() =>
          isMenuLinkActive(item, location)
            ? "side-nav-link active"
            : "side-nav-link"
        }
      >
        {item.icon ? <i className={item.icon} aria-hidden="true" /> : null}
        <span>{item.label}</span>
        {item.showCartBadge && cartCount > 0 ? (
          <em className="side-nav-badge">{cartCount}</em>
        ) : null}
      </NavLink>
    );
  }

  return (
    <nav className="side-nav" aria-label="Panel navigation">
      {menuItems.map((item) => {
        if (item.type === "group") {
          const isOpen = openGroups.has(item.id);
          const isActiveGroup = activeGroupIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`side-nav-group${isActiveGroup ? " has-active" : ""}${
                isOpen ? " open" : ""
              }`}
            >
              <button
                type="button"
                className="side-nav-group-btn"
                aria-expanded={isOpen}
                onClick={() => toggleGroup(item.id)}
              >
                <i className={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
                <i
                  className={`fa-solid fa-chevron-${isOpen ? "up" : "down"} side-nav-chevron`}
                  aria-hidden="true"
                />
              </button>
              {isOpen ? (
                <div className="side-nav-children">
                  {item.children?.map((child) => renderLink(child))}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <div key={item.to || item.label} className="side-nav-item">
            {renderLink(item)}
          </div>
        );
      })}
    </nav>
  );
};

export default SidebarNav;
