import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import VendorRowActions from "../../components/vendor/VendorRowActions";
import { notify } from "../../utils/notify";
import {
  productStatusChipClass,
  productStatusLabel,
} from "../../utils/vendorStatus";
import "../../layouts/PanelLayout.css";

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

const VendorProductTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await productApi.vendorList();
      setProducts(res.data || []);
      setSelected(new Set());
    } catch (err) {
      notify.fromError(err, "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "all" && (p.status || "active") !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        String(p.name || "")
          .toLowerCase()
          .includes(q) ||
        String(p.sku || "")
          .toLowerCase()
          .includes(q) ||
        String(p.brand || "")
          .toLowerCase()
          .includes(q) ||
        String(p.productType || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [products, query, statusFilter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, {
      pageSize: 12,
      resetKey: `${query}:${statusFilter}`,
    });

  const pageIds = pageItems.map((p) => p._id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectedCount = selected.size;

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected(new Set(filtered.map((p) => p._id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function bulkMark(status) {
    if (!selectedCount) {
      notify.warning("Select at least one product.");
      return;
    }
    setBusy(true);
    try {
      const res = await productApi.bulkMark({
        ids: [...selected],
        status,
      });
      notify.success(res.data?.message || `Marked as ${status}`);
      await load();
    } catch (err) {
      notify.fromError(err, "Bulk update failed");
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete() {
    if (!selectedCount) {
      notify.warning("Select at least one product.");
      return;
    }
    if (
      !window.confirm(
        `Delete ${selectedCount} selected product(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await productApi.bulkDelete({ ids: [...selected] });
      notify.success(res.data?.message || "Products deleted");
      await load();
    } catch (err) {
      notify.fromError(err, "Bulk delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteOne(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productApi.remove(product._id);
      notify.success("Product deleted");
      await load();
    } catch (err) {
      notify.fromError(err, "Delete failed");
    }
  }

  async function markOne(product, status) {
    try {
      await productApi.bulkMark({ ids: [product._id], status });
      notify.success(`Marked as ${status}`);
      await load();
    } catch (err) {
      notify.fromError(err, "Status update failed");
    }
  }

  const activeCount = products.filter(
    (p) => (p.status || "active") === "active",
  ).length;
  const inactiveCount = products.length - activeCount;

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Products</h2>
            <p className="page-subtitle">Manage your listings</p>
          </div>
          <div className="vendor-hero-actions">
            <Link className="panel-btn" to="/vendor/products">
              Add product
            </Link>
          </div>
        </div>
      </section>

      <div className="vendor-stat-grid vendor-stat-grid--plain vendor-mini-stats">
        <div className="vendor-stat">
          <p className="muted">Total</p>
          <strong>{products.length}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Active</p>
          <strong>{activeCount}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Draft</p>
          <strong>{inactiveCount}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Selected</p>
          <strong>{selectedCount}</strong>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search name, SKU, brand…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Draft</option>
        </select>
        <button
          type="button"
          className="panel-btn secondary"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="table-card">
        <div className="vendor-toolbar">
          <div className="vendor-toolbar-group">
            <button
              type="button"
              className="panel-btn secondary"
              disabled={busy || !selectedCount}
              onClick={() => bulkMark("active")}
            >
              Mark active
            </button>
            <button
              type="button"
              className="panel-btn secondary"
              disabled={busy || !selectedCount}
              onClick={() => bulkMark("inactive")}
            >
              Mark inactive
            </button>
            <button
              type="button"
              className="panel-btn danger"
              disabled={busy || !selectedCount}
              onClick={bulkDelete}
            >
              Delete selected
            </button>
          </div>
          <div className="vendor-toolbar-group">
            <button
              type="button"
              className="panel-btn secondary"
              onClick={selectAllFiltered}
            >
              Select all ({filtered.length})
            </button>
            <button
              type="button"
              className="panel-btn secondary"
              onClick={clearSelection}
              disabled={!selectedCount}
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? <p className="muted">Loading products…</p> : null}

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 42 }}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={togglePage}
                  aria-label="Select page"
                />
              </th>
              <th>Product</th>
              <th>SKU</th>
              <th>Type</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !pageItems.length ? (
              <tr>
                <td colSpan={8}>
                  <div className="vendor-empty">
                    <p>No products found.</p>
                    <Link className="panel-btn" to="/vendor/products">
                      Add product
                    </Link>
                  </div>
                </td>
              </tr>
            ) : null}
            {pageItems.map((product) => {
              const checked = selected.has(product._id);
              const sell =
                product.discountPrice && product.discountPrice < product.price
                  ? product.discountPrice
                  : product.price;
              const isActive = (product.status || "active") === "active";
              return (
                <tr key={product._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(product._id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td>
                    <div className="table-product">
                      <div className="table-product__thumb">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt="" />
                        ) : (
                          "—"
                        )}
                      </div>
                      <div className="table-product__meta">
                        <strong>{product.name}</strong>
                        <div className="muted">
                          {product.brand || "No brand"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{product.sku || "—"}</td>
                  <td>{product.productType || "generic"}</td>
                  <td>
                    {money(sell)}
                    {product.discountPrice &&
                    product.discountPrice < product.price ? (
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        MRP {money(product.price)}
                      </div>
                    ) : null}
                  </td>
                  <td>{product.stock ?? 0}</td>
                  <td>
                    <span className={productStatusChipClass(product.status)}>
                      {productStatusLabel(product.status)}
                    </span>
                  </td>
                  <td className="vendor-actions-cell">
                    <VendorRowActions
                      items={[
                        {
                          key: "edit",
                          label: "Edit",
                          to: `/vendor/products?edit=${product._id}`,
                        },
                        {
                          key: "status",
                          label: isActive ? "Unpublish" : "Publish",
                          onClick: () =>
                            markOne(product, isActive ? "inactive" : "active"),
                        },
                        {
                          key: "delete",
                          label: "Delete",
                          tone: "danger",
                          onClick: () => deleteOne(product),
                        },
                      ]}
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
      </div>
    </div>
  );
};

export default VendorProductTable;
