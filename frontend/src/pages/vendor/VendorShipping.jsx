import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { storeApi } from "../../api/services";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const VendorShipping = () => {
  const user = useSelector((state) => state.user.user);
  const vendorId = user?.id || user?._id;
  const [store, setStore] = useState(null);
  const [form, setForm] = useState({
    shippingFee: 0,
    freeShippingAbove: "",
    estimatedDeliveryDays: 5,
    shippingPolicy: "",
    returnPolicy: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!vendorId) return;
      setLoading(true);
      try {
        const res = await storeApi.getByVendor(vendorId);
        if (!active) return;
        const data = res.data.data || res.data;
        setStore(data);
        setForm({
          shippingFee: data.shippingFee ?? 0,
          freeShippingAbove: data.freeShippingAbove ?? "",
          estimatedDeliveryDays: data.estimatedDeliveryDays ?? 5,
          shippingPolicy: data.shippingPolicy || "",
          returnPolicy: data.returnPolicy || "",
        });
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 404) {
          notify.warning("Create your store first.");
        } else {
          notify.fromError(err, "Failed to load shipping settings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [vendorId]);

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const preview = useMemo(() => {
    const fee = Number(form.shippingFee) || 0;
    const freeAbove =
      form.freeShippingAbove === "" ? null : Number(form.freeShippingAbove);
    if (freeAbove != null && !Number.isNaN(freeAbove)) {
      return `Customers pay ₹${fee} shipping under ₹${freeAbove}. Free shipping at ₹${freeAbove}+.`;
    }
    return `Customers pay ₹${fee} flat shipping.`;
  }, [form.shippingFee, form.freeShippingAbove]);

  async function handleSave(e) {
    e.preventDefault();
    if (!store?._id) return;
    setSaving(true);

    try {
      const payload = {
        shippingFee: Number(form.shippingFee) || 0,
        freeShippingAbove:
          form.freeShippingAbove === "" ? null : Number(form.freeShippingAbove),
        estimatedDeliveryDays: Number(form.estimatedDeliveryDays) || 5,
        shippingPolicy: form.shippingPolicy,
        returnPolicy: form.returnPolicy,
      };
      const res = await storeApi.update(store._id, payload);
      setStore(res.data.data || res.data);
      notify.success("Shipping saved");
    } catch (err) {
      notify.fromError(err, "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Shipping</h2>
            <p className="page-subtitle">Fees, delivery estimate, and return policy</p>
          </div>
          <div className="vendor-hero-actions">
            <Link className="panel-btn secondary" to="/vendor/store">
              Store details
            </Link>
          </div>
        </div>
      </section>

      {!store?._id ? (
        <div className="vendor-empty">
          <p>Create your store before setting shipping.</p>
          <Link className="panel-btn" to="/vendor/store">
            Create store
          </Link>
        </div>
      ) : (
        <form className="form-card panel-form vendor-labeled-form" onSubmit={handleSave}>
          <p className="vendor-inline-hint">{preview}</p>
          <div className="vendor-form-grid">
            <label>
              Flat shipping fee (₹)
              <input
                type="number"
                min="0"
                name="shippingFee"
                value={form.shippingFee}
                onChange={onChange}
              />
            </label>
            <label>
              Free shipping above (₹)
              <input
                type="number"
                min="0"
                name="freeShippingAbove"
                value={form.freeShippingAbove}
                onChange={onChange}
                placeholder="Optional"
              />
            </label>
            <label>
              Est. delivery (days)
              <input
                type="number"
                min="1"
                name="estimatedDeliveryDays"
                value={form.estimatedDeliveryDays}
                onChange={onChange}
              />
            </label>
          </div>
          <label>
            Shipping policy
            <textarea
              name="shippingPolicy"
              rows={4}
              value={form.shippingPolicy}
              onChange={onChange}
              placeholder="Where you ship, packaging notes…"
            />
          </label>
          <label>
            Return policy
            <textarea
              name="returnPolicy"
              rows={4}
              value={form.returnPolicy}
              onChange={onChange}
              placeholder="Return window and conditions…"
            />
          </label>
          <div className="vendor-form-actions">
            <button type="submit" className="panel-btn" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VendorShipping;
