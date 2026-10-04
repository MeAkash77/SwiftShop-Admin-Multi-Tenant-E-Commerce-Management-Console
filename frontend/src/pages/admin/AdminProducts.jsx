import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  productApi,
  categoryApi,
  storeApi,
  unwrapList,
} from "../../api/services";
import Pagination from "../../components/Pagination";
import TableRowActions from "../../components/shared/TableRowActions";
import AdminReasonModal from "../../components/admin/AdminReasonModal";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [keyword, setKeyword] = useState(() => searchParams.get("q") || "");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [storeId, setStoreId] = useState(
    () => searchParams.get("store") || "all",
  );
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (status !== "all") params.status = status;
      if (category !== "all") params.category = category;
      if (storeId !== "all") params.store = storeId;
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.list(params),
        categoryApi.list(),
      ]);
      setProducts(unwrapList(productsRes.data).data);
      setCategories(categoriesRes.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, storeId]);

  useEffect(() => {
    storeApi
      .list()
      .then((res) => setStores(res.data?.data || []))
      .catch(() => setStores([]));
  }, []);

  useEffect(() => {
    const paramStore = searchParams.get("store");
    if (paramStore && paramStore !== storeId) setStoreId(paramStore);
    const q = searchParams.get("q");
    if (q && q !== keyword) setKeyword(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const activeStore = useMemo(
    () => stores.find((s) => s._id === storeId),
    [stores, storeId],
  );

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.store?.storeName?.toLowerCase().includes(q),
    );
  }, [products, keyword]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, {
      pageSize: 10,
      resetKey: `${keyword}|${category}|${status}|${storeId}`,
    });

  function onStoreChange(value) {
    setStoreId(value);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("store");
    else next.set("store", value);
    setSearchParams(next);
  }

  async function toggleStatus(product) {
    const next = product.status === "active" ? "inactive" : "active";
    try {
      await productApi.update(product._id, { status: next });
      notify.success(`Marked "${product.name}" as ${next}.`);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update product.");
    }
  }

  async function onConfirmDelete(reason) {
    if (!modalProduct) return;
    setBusy(true);
    try {
      await productApi.remove(modalProduct._id);
      try {
        const key = `admin_note_product_${modalProduct._id}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            at: new Date().toISOString(),
            action: "delete",
            reason,
          }),
        );
      } catch {
        // ignore
      }
      notify.success(`Deleted "${modalProduct.name}".`);
      setModalProduct(null);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to delete product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Products</h2>
        <p className="page-subtitle">
          {activeStore
            ? `Products from ${activeStore.storeName}.`
            : "All marketplace products from every vendor store."}
        </p>
      </div>

      {activeStore ? (
        <div className="search-bar" style={{ marginBottom: 0 }}>
          <span className="status-chip">Vendor: {activeStore.storeName}</span>
          <Link
            className="panel-btn secondary"
            to={`/admin/stores/${activeStore._id}`}
          >
            Open store 360
          </Link>
          <button
            type="button"
            className="panel-btn secondary"
            onClick={() => onStoreChange("all")}
          >
            Clear vendor filter
          </button>
        </div>
      ) : null}

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">
            {activeStore ? "Store products" : "Total Products"}
          </p>
          <h3>{products.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Active</p>
          <h3>{products.filter((p) => p.status === "active").length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Inactive</p>
          <h3>{products.filter((p) => p.status !== "active").length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by name, brand, store..."
        />
        <select value={storeId} onChange={(e) => onStoreChange(e.target.value)}>
          <option value="all">All vendors</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.storeName}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading products...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Store</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => (
              <tr key={product._id}>
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
                      <div className="muted">{product.brand || "—"}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {product.store?._id ? (
                    <Link to={`/admin/stores/${product.store._id}`}>
                      {product.store.storeName}
                    </Link>
                  ) : (
                    product.store?.storeName || "—"
                  )}
                </td>
                <td>{product.category?.name || "—"}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <span
                    className={`status-chip ${
                      product.status === "active"
                        ? "status-chip--ok"
                        : "status-chip--bad"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="row-actions">
                  <TableRowActions
                    items={[
                      {
                        key: "toggle",
                        label:
                          product.status === "active" ? "Deactivate" : "Activate",
                        onClick: () => toggleStatus(product),
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        tone: "danger",
                        onClick: () => setModalProduct(product),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? (
          <p className="muted">No products found.</p>
        ) : null}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>

      <AdminReasonModal
        open={Boolean(modalProduct)}
        title="Delete product"
        description={
          modalProduct
            ? `"${modalProduct.name}" will be permanently removed from the marketplace.`
            : ""
        }
        confirmLabel="Delete product"
        onCancel={() => setModalProduct(null)}
        onConfirm={onConfirmDelete}
        busy={busy}
      />
    </div>
  );
};

export default AdminProducts;
