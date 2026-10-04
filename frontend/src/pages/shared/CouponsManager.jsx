import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Pagination from "../../components/Pagination";
import TableRowActions from "../../components/shared/TableRowActions";
import usePagination from "../../hooks/usePagination";
import { couponApi, storeApi } from "../../api/services";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const emptyForm = {
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: "",
  expiresAt: "",
};

const CouponsManager = ({ role = "vendor" }) => {
  const user = useSelector((state) => state.user.user);
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      if (role === "vendor") {
        const vid = user?.id || user?._id;
        if (vid) {
          const storeRes = await storeApi.getByVendor(vid);
          const store = storeRes.data?.data || storeRes.data;
          setStoreId(store?._id || null);
        }
      }
      const res = await couponApi.manage();
      setCoupons(res.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Could not load coupons.");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when identity/role changes
  }, [user?.id, user?._id, role]);

  async function handleCreate(e) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) return;
    try {
      await couponApi.create({
        code,
        type: form.type,
        value: Number(form.value) || 0,
        minOrder: Number(form.minOrder) || 0,
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        expiresAt: form.expiresAt || null,
        storeId: role === "admin" ? storeId : undefined,
      });
      setForm(emptyForm);
      notify.success("Coupon created.");
      await load();
    } catch (err) {
      notify.fromError(err, "Could not create coupon.");
    }
  }

  async function toggle(coupon) {
    try {
      await couponApi.update(coupon._id, { isActive: !coupon.isActive });
      await load();
    } catch (err) {
      notify.fromError(err, "Could not update coupon.");
    }
  }

  async function remove(coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await couponApi.remove(coupon._id);
      notify.success("Coupon deleted.");
      await load();
    } catch (err) {
      notify.fromError(err, "Could not delete coupon.");
    }
  }

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(coupons, { pageSize: 8 });

  const activeCount = useMemo(
    () => coupons.filter((c) => c.isActive).length,
    [coupons],
  );

  function formatDiscount(coupon) {
    if (coupon.type === "fixed") return `₹${coupon.value}`;
    return `${coupon.value}%`;
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-copy">
          <h2 className="page-title">
            {role === "vendor" ? "Discounts" : "Coupons & Offers"}
          </h2>
          <p className="page-subtitle">
            {role === "vendor"
              ? "Discount codes for checkout"
              : "Create discount codes customers can apply at checkout."}
          </p>
        </div>
      </section>

      <div className="vendor-stat-grid vendor-stat-grid--plain vendor-mini-stats">
        <div className="vendor-stat">
          <p className="muted">Total</p>
          <strong>{coupons.length}</strong>
        </div>
        <div className="vendor-stat">
          <p className="muted">Active</p>
          <strong>{activeCount}</strong>
        </div>
      </div>

      <div className="form-card">
        <h3>Create discount</h3>
        <form className="stack-gap" onSubmit={handleCreate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <input
              placeholder="CODE"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              required
            />
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed ₹</option>
            </select>
            <input
              type="number"
              min="0"
              max={form.type === "percent" ? 100 : undefined}
              placeholder={form.type === "percent" ? "Discount %" : "Amount ₹"}
              value={form.value}
              onChange={(e) =>
                setForm((p) => ({ ...p, value: e.target.value }))
              }
              required
            />
            <input
              type="number"
              min="0"
              placeholder="Min order (₹)"
              value={form.minOrder}
              onChange={(e) =>
                setForm((p) => ({ ...p, minOrder: e.target.value }))
              }
            />
            <input
              type="number"
              min="1"
              placeholder="Max uses (optional)"
              value={form.maxUses}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxUses: e.target.value }))
              }
            />
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) =>
                setForm((p) => ({ ...p, expiresAt: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="panel-btn">
            Save Coupon
          </button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min order</th>
              <th>Uses</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            ) : null}
            {!loading &&
              pageItems.map((coupon) => (
                <tr key={coupon._id}>
                  <td>
                    <strong>{coupon.code}</strong>
                  </td>
                  <td>{formatDiscount(coupon)}</td>
                  <td>₹{coupon.minOrder || 0}</td>
                  <td>
                    {coupon.usedCount || 0}
                    {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td>
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td>{coupon.isActive ? "Active" : "Paused"}</td>
                  <td className="row-actions">
                    <TableRowActions
                      items={[
                        {
                          key: "toggle",
                          label: coupon.isActive ? "Pause" : "Activate",
                          onClick: () => toggle(coupon),
                        },
                        {
                          key: "delete",
                          label: "Delete",
                          tone: "danger",
                          onClick: () => remove(coupon),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            {!loading && coupons.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  No coupons yet. Create your first offer above.
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

export default CouponsManager;
