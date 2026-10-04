import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiInstance from "../../api/apiInstaince";
import "./AdminPortal.css";
import { notify } from "../../utils/notify";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  setupSecret: "",
};

const AdminSetup = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    apiInstance
      .get("/admin/auth/status")
      .then((res) => {
        if (!active) return;
        if (res.data.hasAdmin) {
          navigate("/admin/login", { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiInstance.post("/admin/auth/create", form);
      notify.success(response.data.message || "Admin created.");
      navigate("/admin/login", { replace: true });
    } catch (err) {
      notify.fromError(err, "Failed to create admin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="admin-portal">
        <div className="admin-portal-card">
          <p>Checking admin portal status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal">
      <div className="admin-portal-card">
        <p className="admin-portal-eyebrow">One-time setup</p>
        <h1>Create Super Admin</h1>
        <p className="admin-portal-lead">
          Use the <code>ADMIN_SETUP_SECRET</code> from your backend <code>.env</code> to
          bootstrap the first admin. This page is disabled after an admin exists.
        </p>

        <form className="admin-portal-form" onSubmit={handleSubmit}>
          <div className="admin-portal-row">
            <div>
              <label htmlFor="setup-firstName">First name</label>
              <input
                id="setup-firstName"
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label htmlFor="setup-lastName">Last name</label>
              <input
                id="setup-lastName"
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <label htmlFor="setup-email">Admin email</label>
          <input
            id="setup-email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
          />

          <label htmlFor="setup-phone">Phone (optional)</label>
          <input
            id="setup-phone"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
          />

          <label htmlFor="setup-password">Password (min 8 chars)</label>
          <input
            id="setup-password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            minLength={8}
            required
          />

          <label htmlFor="setup-secret">Setup secret</label>
          <input
            id="setup-secret"
            type="password"
            name="setupSecret"
            value={form.setupSecret}
            onChange={onChange}
            required
            autoComplete="off"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Super Admin"}
          </button>
        </form>

        <p className="admin-portal-footer">
          Already set up? <Link to="/admin/login">Admin login</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;
