import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  orderApi,
  productApi,
  storeApi,
  unwrapList,
  userApi,
} from "../../api/services";

/**
 * Global admin search — orders, customers, vendors/stores, products.
 */
export default function AdminGlobalSearch() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [usersRes, storesRes, ordersRes, productsRes] = await Promise.all([
          userApi.list({}),
          storeApi.list(),
          orderApi.listAll(),
          productApi.list({ page: 1, limit: 80 }),
        ]);
        if (!active) return;

        const users = usersRes.data?.data || [];
        const stores = storesRes.data?.data || [];
        const orders = ordersRes.data?.data || [];
        const products = unwrapList(productsRes.data).data;

        const customers = users
          .filter((u) => u.role === "customer")
          .filter((u) => {
            const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
            return (
              name.includes(q) ||
              String(u.email || "").toLowerCase().includes(q) ||
              String(u.phoneNumber || "").includes(q)
            );
          })
          .slice(0, 5)
          .map((u) => ({
            id: u._id,
            title: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            meta: u.email,
            to: `/admin/customers/${u._id}`,
          }));

        const storeHits = stores
          .filter((s) => {
            const vendor = s.vendorId;
            const vendorName = `${vendor?.firstName || ""} ${vendor?.lastName || ""}`.toLowerCase();
            return (
              String(s.storeName || "").toLowerCase().includes(q) ||
              String(s.email || "").toLowerCase().includes(q) ||
              String(vendor?.email || "").toLowerCase().includes(q) ||
              vendorName.includes(q)
            );
          })
          .slice(0, 5)
          .map((s) => ({
            id: s._id,
            title: s.storeName,
            meta: s.vendorId?.email || s.email || "Store",
            to: `/admin/stores/${s._id}`,
          }));

        const orderHits = orders
          .filter((o) => {
            const num = String(o.orderNumber || o._id || "").toLowerCase();
            const email = String(
              o.customerId?.email || o.shippingAddress?.email || ""
            ).toLowerCase();
            return num.includes(q) || email.includes(q);
          })
          .slice(0, 5)
          .map((o) => ({
            id: o._id,
            title: o.orderNumber || o._id,
            meta: `${o.orderStatus || "—"} · ${o.storeId?.storeName || "Store"}`,
            to: `/admin/orders?highlight=${o._id}`,
          }));

        const productHits = products
          .filter((p) => {
            return (
              String(p.name || "").toLowerCase().includes(q) ||
              String(p.sku || "").toLowerCase().includes(q) ||
              String(p.slug || "").toLowerCase().includes(q)
            );
          })
          .slice(0, 5)
          .map((p) => ({
            id: p._id,
            title: p.name,
            meta: p.storeId?.storeName || p.sku || "Product",
            to: `/admin/products?q=${encodeURIComponent(p.name || "")}`,
          }));

        const next = [];
        if (orderHits.length) next.push({ label: "Orders", items: orderHits });
        if (customers.length) next.push({ label: "Customers", items: customers });
        if (storeHits.length) next.push({ label: "Vendors / Stores", items: storeHits });
        if (productHits.length) next.push({ label: "Products", items: productHits });
        setGroups(next);
        setActiveIdx(0);
        setOpen(true);
      } catch {
        if (active) setGroups([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const flat = groups.flatMap((g) => g.items);

  function go(item) {
    if (!item) return;
    setOpen(false);
    setQuery("");
    navigate(item.to);
  }

  function onKeyDown(e) {
    if (!open || !flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="aw-search" ref={rootRef}>
      <i className="fa-solid fa-magnifying-glass aw-search__icon" aria-hidden="true" />
      <input
        className="aw-search__input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search orders, customers, vendors, products…"
        aria-label="Global admin search"
        autoComplete="off"
      />
      {open && (loading || groups.length > 0 || query.trim().length >= 2) ? (
        <div className="aw-search__panel" role="listbox">
          {loading ? (
            <p className="aw-search__meta" style={{ padding: "0.75rem 0.85rem" }}>
              Searching…
            </p>
          ) : null}
          {!loading && groups.length === 0 ? (
            <p className="aw-search__meta" style={{ padding: "0.75rem 0.85rem" }}>
              No matches
            </p>
          ) : null}
          {!loading
            ? groups.map((group) => (
                <div className="aw-search__group" key={group.label}>
                  <p className="aw-search__group-title">{group.label}</p>
                  {group.items.map((item) => {
                    const idx = flat.findIndex((f) => f.id === item.id && f.to === item.to);
                    return (
                      <button
                        key={`${group.label}-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={idx === activeIdx}
                        className={`aw-search__item${idx === activeIdx ? " is-active" : ""}`}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => go(item)}
                      >
                        {item.title}
                        <span className="aw-search__meta">{item.meta}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
