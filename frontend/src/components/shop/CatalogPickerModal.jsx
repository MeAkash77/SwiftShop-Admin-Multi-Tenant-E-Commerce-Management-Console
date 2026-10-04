import { useEffect, useMemo, useState } from "react";
import { catalogApi } from "../../api/services";
import { notify } from "../../utils/notify";
import "./CatalogPickerModal.css";

function formatPrice(n) {
  if (n == null || n === "") return "";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/**
 * Vendor catalog browser: Brand → Product → confirm.
 * On confirm, returns the full master item so the form can auto-fill.
 */
export default function CatalogPickerModal({ open, onClose, onSelect }) {
  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [picking, setPicking] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingBrands(true);
    catalogApi
      .brands()
      .then((res) => {
        if (cancelled) return;
        setBrands(res.data?.brands || []);
      })
      .catch((err) => notify.fromError(err, "Could not load brands."))
      .finally(() => !cancelled && setLoadingBrands(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingItems(true);
    const params = {};
    if (activeBrand) params.brand = activeBrand;
    if (query.trim()) params.q = query.trim();
    params.limit = 60;
    catalogApi
      .list(params)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data?.data || []);
      })
      .catch((err) => notify.fromError(err, "Could not load catalog."))
      .finally(() => !cancelled && setLoadingItems(false));
    return () => {
      cancelled = true;
    };
  }, [open, activeBrand, query]);

  const totalCount = useMemo(
    () => brands.reduce((n, b) => n + (b.count || 0), 0),
    [brands]
  );

  async function confirm(item) {
    setPicking(item._id);
    try {
      const res = await catalogApi.getById(item._id);
      const full = res.data?.item || item;
      onSelect?.(full);
      onClose?.();
    } catch (err) {
      notify.fromError(err, "Could not load product details.");
    } finally {
      setPicking(null);
    }
  }

  if (!open) return null;

  return (
    <div className="cpm-overlay" role="dialog" aria-modal="true">
      <div className="cpm-modal">
        <header className="cpm-head">
          <div>
            <h2>Add from catalog</h2>
            <p>Pick a brand and product — all details auto-fill. Edit before publishing.</p>
          </div>
          <button type="button" className="cpm-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="cpm-body">
          <aside className="cpm-brands">
            <input
              className="cpm-search"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="button"
              className={`cpm-brand${activeBrand === "" ? " is-on" : ""}`}
              onClick={() => setActiveBrand("")}
            >
              <span>All brands</span>
              <em>{totalCount}</em>
            </button>
            {loadingBrands ? (
              <p className="cpm-muted">Loading brands…</p>
            ) : (
              brands.map((b) => (
                <button
                  key={b.brand}
                  type="button"
                  className={`cpm-brand${activeBrand === b.brand ? " is-on" : ""}`}
                  onClick={() => setActiveBrand(b.brand)}
                >
                  <span>{b.brand}</span>
                  <em>{b.count}</em>
                </button>
              ))
            )}
            {!loadingBrands && !brands.length ? (
              <p className="cpm-muted">
                No catalog yet. Ask admin to add master products.
              </p>
            ) : null}
          </aside>

          <div className="cpm-list">
            {loadingItems ? (
              <p className="cpm-muted">Loading products…</p>
            ) : items.length ? (
              <div className="cpm-grid">
                {items.map((item) => (
                  <article key={item._id} className="cpm-card">
                    <div className="cpm-thumb">
                      {item.images?.[0]?.url ? (
                        <img src={item.images[0].url} alt="" />
                      ) : (
                        <span>No image</span>
                      )}
                    </div>
                    <div className="cpm-card-body">
                      <span className="cpm-brand-tag">{item.brand}</span>
                      <h3>{item.name}</h3>
                      {item.shortDescription ? (
                        <p className="cpm-desc">{item.shortDescription}</p>
                      ) : null}
                      <div className="cpm-models">
                        {(item.optionGroups || []).slice(0, 3).map((g) => (
                          <span key={g.key} className="cpm-model">
                            {g.label}: {(g.values || []).slice(0, 3).join(", ")}
                            {(g.values || []).length > 3 ? "…" : ""}
                          </span>
                        ))}
                        {!item.optionGroups?.length ? (
                          <span className="cpm-model">Single model</span>
                        ) : null}
                      </div>
                      <div className="cpm-foot">
                        <span className="cpm-price">
                          {formatPrice(item.suggestedDiscountPrice || item.suggestedPrice)}
                          {item.suggestedDiscountPrice &&
                          item.suggestedPrice &&
                          item.suggestedDiscountPrice !== item.suggestedPrice ? (
                            <s>{formatPrice(item.suggestedPrice)}</s>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          className="cpm-use"
                          disabled={picking === item._id}
                          onClick={() => confirm(item)}
                        >
                          {picking === item._id ? "Loading…" : "Use this"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="cpm-muted">No products match.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
