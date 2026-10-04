import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { storeApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import TableRowActions from "../../components/shared/TableRowActions";
import AdminReasonModal from "../../components/admin/AdminReasonModal";
import usePagination from "../../hooks/usePagination";
import { notify } from "../../utils/notify";

const AdminStores = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all",
  );
  const [loading, setLoading] = useState(true);
  const [modalStore, setModalStore] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await storeApi.list();
      setStores(response.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load stores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = stores;
    if (statusFilter === "inactive") {
      list = list.filter((s) => s.isActive === false);
    } else if (statusFilter === "active") {
      list = list.filter((s) => s.isActive !== false);
    }
    const q = keyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter((store) => {
      const vendor = store.vendorId;
      const vendorName =
        `${vendor?.firstName || ""} ${vendor?.lastName || ""}`.toLowerCase();
      return (
        store.storeName?.toLowerCase().includes(q) ||
        store.email?.toLowerCase().includes(q) ||
        vendor?.email?.toLowerCase().includes(q) ||
        vendorName.includes(q)
      );
    });
  }, [stores, keyword, statusFilter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, {
      pageSize: 10,
      resetKey: `${keyword}:${statusFilter}`,
    });

  function onStatusChange(value) {
    setStatusFilter(value);
    if (value === "all") setSearchParams({});
    else setSearchParams({ status: value });
  }

  async function reinstate(store) {
    try {
      await storeApi.update(store._id, { isActive: true });
      notify.success(`${store.storeName} reinstated.`);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update store.");
    }
  }

  async function onConfirmSuspend(reason) {
    if (!modalStore) return;
    setBusy(true);
    try {
      await storeApi.update(modalStore._id, { isActive: false });
      try {
        const key = `admin_note_store_${modalStore._id}`;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({
          at: new Date().toISOString(),
          action: "suspend",
          reason,
        });
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
      } catch {
        // ignore
      }
      notify.success(`${modalStore.storeName} suspended.`);
      setModalStore(null);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update store.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Stores</h2>
        <p className="page-subtitle">
          Vendor stores across the marketplace. Open a store for KPIs and
          catalog.
        </p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Total</p>
          <h3>{stores.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Active</p>
          <h3>{stores.filter((s) => s.isActive !== false).length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Suspended</p>
          <h3>{stores.filter((s) => s.isActive === false).length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search store or vendor..."
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended / inactive</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading stores...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Vendor</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((store) => {
              const vendor = store.vendorId;
              const active = store.isActive !== false;
              return (
                <tr
                  key={store._id}
                  className="aw-link-row"
                  onClick={() => navigate(`/admin/stores/${store._id}`)}
                >
                  <td>
                    <Link
                      to={`/admin/stores/${store._id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <strong>{store.storeName}</strong>
                    </Link>
                  </td>
                  <td>
                    {vendor ? (
                      <>
                        <div>
                          {vendor.firstName} {vendor.lastName}
                        </div>
                        <div className="muted">{vendor.email}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div>{store.email}</div>
                    <div className="muted">{store.phone}</div>
                  </td>
                  <td>
                    <span
                      className={`status-chip ${active ? "status-chip--ok" : "status-chip--bad"}`}
                    >
                      {active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td
                    className="row-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableRowActions
                      maxPrimary={1}
                      items={[
                        {
                          key: "open",
                          label: "Open",
                          to: `/admin/stores/${store._id}`,
                        },
                        {
                          key: "products",
                          label: "Products",
                          to: `/admin/products?store=${store._id}`,
                        },
                        active
                          ? {
                              key: "suspend",
                              label: "Suspend",
                              tone: "danger",
                              onClick: () => setModalStore(store),
                            }
                          : {
                              key: "reinstate",
                              label: "Reinstate",
                              onClick: () => reinstate(store),
                            },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? (
          <p className="muted">No stores found.</p>
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
        open={Boolean(modalStore)}
        title="Suspend store"
        description={
          modalStore
            ? `${modalStore.storeName} will stop selling until reinstated.`
            : ""
        }
        confirmLabel="Suspend store"
        onCancel={() => setModalStore(null)}
        onConfirm={onConfirmSuspend}
        busy={busy}
      />
    </div>
  );
};

export default AdminStores;
