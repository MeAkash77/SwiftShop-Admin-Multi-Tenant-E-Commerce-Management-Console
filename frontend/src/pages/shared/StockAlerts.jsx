import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productApi, unwrapList } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const StockAlerts = ({ scope = "admin" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response =
          scope === "vendor"
            ? await productApi.vendorList()
            : await productApi.list({});
        if (!active) return;
        const list = unwrapList(response.data).data;
        setProducts(list);
      } catch (err) {
        if (!active) return;
        notify.fromError(err, "Failed to load stock alerts.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [scope]);

  const alerts = useMemo(
    () =>
      products
        .filter((p) => Number(p.stock) <= 10)
        .sort((a, b) => Number(a.stock) - Number(b.stock)),
    [products]
  );

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(alerts, { pageSize: 10 });

  const outCount = alerts.filter((p) => Number(p.stock) <= 0).length;
  const lowCount = alerts.filter((p) => Number(p.stock) > 0).length;

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">
              {scope === "vendor" ? "Low stock" : "Stock Alerts"}
            </h2>
            <p className="page-subtitle">
              Products at or below 10 units
            </p>
          </div>
          {scope === "vendor" ? (
            <div className="vendor-hero-actions">
              <Link className="panel-btn secondary" to="/vendor/inventory">
                Inventory
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <div className="vendor-stat-grid vendor-stat-grid--plain vendor-mini-stats">
        <div className="vendor-stat">
          <p className="muted">Alert items</p>
          <strong>{alerts.length}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Out of stock</p>
          <strong>{outCount}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Low stock</p>
          <strong>{lowCount}</strong>
        </div>
      </div>
      {loading ? <p className="muted">Checking stock...</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Store</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => {
              const stock = Number(product.stock) || 0;
              return (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{stock}</td>
                  <td>
                    <span className="status-chip">
                      {stock <= 0 ? "Out of stock" : "Low stock"}
                    </span>
                  </td>
                  <td>
                    {product.store?.storeName ||
                      product.storeName ||
                      (scope === "vendor" ? "Your store" : "—")}
                  </td>
                </tr>
              );
            })}
            {!loading && alerts.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="vendor-empty">
                    <p>All stock looks healthy.</p>
                    {scope === "vendor" ? (
                      <Link className="panel-btn secondary" to="/vendor/inventory">
                        Inventory
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </div>
  );
};

export default StockAlerts;
