import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import VendorRowActions from "../../components/vendor/VendorRowActions";
import { notify } from "../../utils/notify";
import { stockStatusChipClass, stockStatusLabel } from "../../utils/vendorStatus";

const LOW = 10;

const VendorInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    productApi
      .vendorList()
      .then((res) => setProducts(res.data || []))
      .catch((err) => notify.fromError(err, "Unable to load inventory."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      if (stockFilter === "low" && stock > LOW) return false;
      if (stockFilter === "out" && stock > 0) return false;
      if (stockFilter === "ok" && stock <= LOW) return false;
      if (!q) return true;
      return (
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.sku || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, stockFilter]);

  const lowStock = products.filter((item) => (item.stock || 0) <= LOW).length;
  const totalUnits = products.reduce((sum, item) => sum + (item.stock || 0), 0);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(
    filtered,
    { pageSize: 12, resetKey: `${query}:${stockFilter}` }
  );

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Inventory</h2>
            <p className="page-subtitle">Stock levels across your products</p>
          </div>
          <div className="vendor-hero-actions">
            <Link className="panel-btn secondary" to="/vendor/alerts">
              Low stock
            </Link>
            <Link className="panel-btn" to="/vendor/products">
              Add product
            </Link>
          </div>
        </div>
      </section>

      <div className="vendor-stat-grid vendor-stat-grid--plain vendor-mini-stats">
        <div className="vendor-stat">
          <p className="muted">SKUs</p>
          <strong>{loading ? "…" : products.length}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Units</p>
          <strong>{loading ? "…" : totalUnits}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Low (≤{LOW})</p>
          <strong>{loading ? "…" : lowStock}</strong>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search product or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="all">All stock</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="muted" style={{ padding: "1rem" }}>
            Loading…
          </p>
        ) : !pageItems.length ? (
          <div className="vendor-empty">
            <p>{products.length ? "No products match this filter." : "No products yet."}</p>
            <Link className="panel-btn" to="/vendor/products">
              Add product
            </Link>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((product) => {
                  const stock = Number(product.stock || 0);
                  return (
                    <tr key={product._id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td className="muted">{product.sku || "—"}</td>
                      <td className="table-num">{stock}</td>
                      <td>
                        <span className={stockStatusChipClass(stock, LOW)}>
                          {stockStatusLabel(stock, LOW)}
                        </span>
                      </td>
                      <td className="vendor-actions-cell">
                        <VendorRowActions
                          primary={
                            <Link
                              className="panel-btn secondary"
                              to={`/vendor/products?edit=${product._id}`}
                            >
                              Edit
                            </Link>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              from={from}
              to={to}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VendorInventory;
