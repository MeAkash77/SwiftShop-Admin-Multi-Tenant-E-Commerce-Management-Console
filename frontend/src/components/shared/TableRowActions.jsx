import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

/**
 * Shopify-plain table actions: quiet text links + ⋯ menu for extra / danger.
 * items: { key?, label, onClick?, to?, disabled?, tone?: "danger" }
 */
export default function TableRowActions({ items = [], maxPrimary = 1 }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const list = (Array.isArray(items) ? items : []).filter(Boolean);
  const primary = [];
  const overflow = [];

  for (const item of list) {
    const isDanger = item.tone === "danger";
    if (!isDanger && primary.length < maxPrimary) {
      primary.push(item);
    } else {
      overflow.push(item);
    }
  }

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return undefined;

    function place() {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth || 152;
      const menuHeight = menuRef.current?.offsetHeight || 80;
      const gap = 4;
      let top = rect.bottom + gap;
      let left = rect.right - menuWidth;

      if (top + menuHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - menuHeight - gap);
      }
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - menuWidth - 8);
      }

      setMenuPos({ top, left });
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, overflow.length]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(e) {
      const t = e.target;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!list.length) return <span className="muted">—</span>;

  return (
    <div className="tra" ref={rootRef}>
      {primary.map((item) => (
        <ActionControl key={item.key || item.label} item={item} variant="link" />
      ))}

      {overflow.length > 0 ? (
        <div className="tra-overflow">
          <button
            ref={buttonRef}
            type="button"
            className={`tra-more${open ? " is-open" : ""}`}
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {open
            ? createPortal(
                <div
                  ref={menuRef}
                  className={`tra-menu tra-menu--portal${
                    document.querySelector(".panel-shell--dark")
                      ? " tra-menu--dark"
                      : ""
                  }`}
                  id={menuId}
                  role="menu"
                  style={{ top: menuPos.top, left: menuPos.left }}
                >
                  {overflow.map((item) => (
                    <ActionControl
                      key={item.key || item.label}
                      item={item}
                      variant="menu"
                      onDone={() => setOpen(false)}
                    />
                  ))}
                </div>,
                document.body
              )
            : null}
        </div>
      ) : null}
    </div>
  );
}

function ActionControl({ item, variant, onDone }) {
  const className =
    variant === "menu"
      ? `tra-menu-item${item.tone === "danger" ? " tra-menu-item--danger" : ""}`
      : `tra-link${item.tone === "danger" ? " tra-link--danger" : ""}`;

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.disabled) return;
    item.onClick?.(e);
    onDone?.();
  };

  if (item.to) {
    return (
      <Link
        className={className}
        to={item.to}
        role={variant === "menu" ? "menuitem" : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onDone?.();
        }}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={item.disabled}
      role={variant === "menu" ? "menuitem" : undefined}
      onClick={handleClick}
    >
      {item.label}
    </button>
  );
}
