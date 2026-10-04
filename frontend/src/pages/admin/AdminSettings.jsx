import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import apiInstance from "../../api/apiInstaince";
import { notify } from "../../utils/notify";
import "../../layouts/PanelLayout.css";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
};

const AdminSettings = () => {
  const user = useSelector((state) => state.user.user);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function loadAdmins() {
    try {
      const res = await apiInstance.get("/admin/auth/admins");
      setAdmins(res.data.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load admins.");
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiInstance.post("/admin/auth/create", form);
      notify.success(res.data.message || "Admin created.");
      setForm(emptyForm);
      await loadAdmins();
    } catch (err) {
      notify.fromError(err, "Failed to create admin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">
          Admin portal account and Super Admin management.
        </p>
      </div>

      <div className="form-card">
        <h3>Signed-in Admin</h3>
        <p className="muted">Portal: /admin/login</p>
        <p>
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>
        </p>
        <p className="muted">{user?.email}</p>
        <p>
          Role: <span className="status-chip">{user?.role}</span>
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Link className="panel-btn secondary" to="/admin/profile">
            Edit Profile
          </Link>
          <Link className="panel-btn" to="/admin/change-password">
            Change Password
          </Link>
        </div>
      </div>

      <div className="form-card">
        <h3>Create another Super Admin</h3>
        <p className="muted">
          Additional admins are created here (not on public registration).
        </p>
        <form className="stack-gap" onSubmit={handleCreate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={onChange}
              required
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={onChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Admin email"
              value={form.email}
              onChange={onChange}
              required
            />
            <input
              name="phoneNumber"
              placeholder="Phone (optional)"
              value={form.phoneNumber}
              onChange={onChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 8)"
              value={form.password}
              onChange={onChange}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="panel-btn" disabled={submitting}>
            {submitting ? "Creating..." : "Create Super Admin"}
          </button>
        </form>
      </div>

      <div className="form-card">
        <h3>Super Admins ({admins.length})</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    {admin.firstName} {admin.lastName}
                  </td>
                  <td>{admin.email}</td>
                  <td>{admin.isActive === false ? "Inactive" : "Active"}</td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={3}>No admins found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
