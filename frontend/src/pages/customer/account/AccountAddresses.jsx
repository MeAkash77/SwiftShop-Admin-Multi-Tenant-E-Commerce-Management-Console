import { useEffect, useState } from "react";
import { addressApi } from "../../../api/services";
import usePagination from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import { notify } from "../../../utils/notify";

const STORAGE_KEY = "mc_addresses";

const emptyForm = {
  fullName: "",
  phone: "",
  pincode: "",
  locality: "",
  addressLine: "",
  city: "",
  state: "",
  addressType: "Home",
  isDefault: false,
};

const AccountAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await addressApi.list();
      let list = res.data?.data || [];

      // One-time migrate old localStorage addresses if server list is empty
      if (!list.length) {
        try {
          const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          if (local.length) {
            for (const item of local) {
              await addressApi.create({
                fullName: item.name || item.fullName,
                phone: item.phone,
                pincode: item.pincode,
                locality: item.locality,
                addressLine: item.address || item.addressLine,
                city: item.city,
                state: item.state,
                addressType: item.type || item.addressType || "Home",
              });
            }
            localStorage.removeItem(STORAGE_KEY);
            const refreshed = await addressApi.list();
            list = refreshed.data?.data || [];
            notify.success("Saved addresses synced to your account.");
          }
        } catch {
          /* ignore migrate errors */
        }
      }

      setAddresses(list);
      if (!list.length) setShowForm(true);
    } catch (err) {
      notify.fromError(err, "Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(
    addresses,
    { pageSize: 6 }
  );

  async function saveAddress(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await addressApi.create(form);
      notify.success("Address saved.");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      notify.fromError(err, "Could not save address.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id) {
    if (!window.confirm("Delete this address?")) return;
    try {
      await addressApi.remove(id);
      notify.success("Address deleted.");
      await load();
    } catch (err) {
      notify.fromError(err, "Could not delete address.");
    }
  }

  async function makeDefault(id) {
    try {
      await addressApi.setDefault(id);
      notify.success("Default address updated.");
      await load();
    } catch (err) {
      notify.fromError(err, "Could not update default.");
    }
  }

  return (
    <div className="fk-panel">
      <div className="fk-panel-head">
        <h1>Manage Addresses</h1>
        <button type="button" className="fk-edit-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ ADD A NEW ADDRESS"}
        </button>
      </div>

      <p className="shop-muted" style={{ marginTop: 0 }}>
        Add a delivery address before you can place an order or pay online.
      </p>

      {showForm ? (
        <form className="fk-form" onSubmit={saveAddress}>
          <div className="fk-form-row">
            <input
              required
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            />
            <input
              required
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="fk-form-row">
            <input
              required
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
            />
            <input
              required
              placeholder="Locality"
              value={form.locality}
              onChange={(e) => setForm((p) => ({ ...p, locality: e.target.value }))}
            />
          </div>
          <textarea
            required
            placeholder="Address (Area and Street)"
            rows={3}
            value={form.addressLine}
            onChange={(e) => setForm((p) => ({ ...p, addressLine: e.target.value }))}
          />
          <div className="fk-form-row">
            <input
              required
              placeholder="City/District/Town"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
            />
          </div>
          <div className="fk-radio-row">
            {["Home", "Work", "Other"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="addressType"
                  value={type}
                  checked={form.addressType === type}
                  onChange={(e) => setForm((p) => ({ ...p, addressType: e.target.value }))}
                />
                {type}
              </label>
            ))}
          </div>
          <label className="fk-radio-row">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
            />
            Make this my default address
          </label>
          <button type="submit" className="shop-btn shop-btn-primary" disabled={saving}>
            {saving ? "Saving…" : "SAVE ADDRESS"}
          </button>
        </form>
      ) : null}

      {loading ? <p className="shop-muted">Loading addresses…</p> : null}

      <div className="fk-address-list">
        {!loading && addresses.length ? (
          <>
            {pageItems.map((item) => (
              <div className="fk-address-card" key={item._id}>
                <span className="fk-address-type">
                  {item.addressType}
                  {item.isDefault ? " · Default" : ""}
                </span>
                <h3>
                  {item.fullName} <span>{item.phone}</span>
                </h3>
                <p>
                  {item.addressLine}, {item.locality}, {item.city}, {item.state} -{" "}
                  <strong>{item.pincode}</strong>
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!item.isDefault ? (
                    <button
                      type="button"
                      className="fk-edit-btn"
                      onClick={() => makeDefault(item._id)}
                    >
                      SET AS DEFAULT
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="fk-edit-btn"
                    onClick={() => removeAddress(item._id)}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
            <Pagination
              variant="shop"
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              from={from}
              to={to}
              onPageChange={setPage}
            />
          </>
        ) : null}
        {!loading && !addresses.length ? (
          <p className="shop-muted">No addresses saved yet. Add a delivery address to continue shopping.</p>
        ) : null}
      </div>
    </div>
  );
};

export default AccountAddresses;
