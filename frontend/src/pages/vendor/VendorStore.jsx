import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { storeApi } from "../../api/services";
import { notify } from "../../utils/notify";

const emptyForm = {
  storeName: "",
  email: "",
  description: "",
  phone: "",
  address: "",
};

const VendorStore = () => {
  const user = useSelector((state) => state.user.user);
  const [store, setStore] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await storeApi.getByVendor(user.id);
        const data = response.data.data;
        setStore(data);
        setForm({
          storeName: data.storeName || "",
          email: data.email || "",
          description: data.description || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } catch {
        setStore(null);
        setForm({
          ...emptyForm,
          email: user?.email || "",
        });
      }
    }

    if (user?.id) load();
  }, [user]);

  function updateField(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      if (store?._id) {
        const response = await storeApi.update(store._id, form);
        setStore(response.data.data);
        notify.success("Store saved");
      } else {
        const response = await storeApi.create({
          ...form,
          vendorId: user.id,
        });
        setStore(response.data.data);
        notify.success("Store created");
      }
    } catch (err) {
      notify.fromError(err, "Failed to save store.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Store details</h2>
            <p className="page-subtitle">
              {store ? "Update how your store appears to customers" : "Create your store to start selling"}
            </p>
          </div>
          {store ? (
            <div className="vendor-hero-actions">
              <Link className="panel-btn secondary" to="/vendor/shipping">
                Shipping
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <div className="form-card">
        <form className="panel-form vendor-labeled-form" onSubmit={handleSubmit}>
          <label>
            Store name
            <input
              name="storeName"
              value={form.storeName}
              onChange={updateField}
              required
              autoComplete="organization"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={updateField}
              required
              autoComplete="tel"
            />
          </label>
          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={updateField}
              required
              autoComplete="street-address"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              required
              rows={4}
            />
          </label>
          <div className="vendor-form-actions">
            <button className="panel-btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : store ? "Save" : "Create store"}
            </button>
            {store ? (
              <Link className="panel-btn secondary" to="/customer" target="_blank" rel="noreferrer">
                View storefront
              </Link>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorStore;
