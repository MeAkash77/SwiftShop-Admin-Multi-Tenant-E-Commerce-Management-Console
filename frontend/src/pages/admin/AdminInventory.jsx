import { useEffect, useMemo, useState } from "react";
import { productApi, unwrapList } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await productApi.list({ page: 1, limit: 48 });
      setProducts(unwrapList(response.data).data);
    } catch (err) {
      notify.fromError(err, "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "low") return products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10);
    if (filter === "out") return products.filter((p) => Number(p.stock) <= 0);
    if (filter === "ok") return products.filter((p) => Number(p.stock) > 10);
    return products;
  }, [products, filter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(filtered, {
    pageSize: 10,
    resetKey: filter,
  });

  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStock = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
  const outStock = products.filter((p) => Number(p.stock) <= 0).length;

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Inventory</h2>
        <p className="page-subtitle">Stock levels across all vendor products.</p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Total Stock Units</p>
          <h3>{totalStock}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Low Stock (≤10)</p>
          <h3>{lowStock}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Out of Stock</p>
          <h3>{outStock}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All products</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading inventory...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Store</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.store?.storeName || "—"}</td>
                <td>{product.sku || "—"}</td>
                <td>
                  <strong
                    style={{
                      color:
                        Number(product.stock) <= 0
                          ? "#f87171"
                          : Number(product.stock) <= 10
                            ? "#fbbf24"
                            : "#4ade80",
                    }}
                  >
                    {product.stock}
                  </strong>
                </td>
                <td>
                  <span className="status-chip">
                    {Number(product.stock) <= 0
                      ? "Out of stock"
                      : Number(product.stock) <= 10
                        ? "Low"
                        : "OK"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? <p className="muted">No inventory rows.</p> : null}
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

export default AdminInventory;
