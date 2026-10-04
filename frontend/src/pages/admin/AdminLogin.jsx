import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import apiInstance from "../../api/apiInstaince";
import { loginSuccess } from "../../features/user/userSlice";
import PortalLink from "../../components/PortalLink";
import "./AdminPortal.css";
import { notify } from "../../utils/notify";

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    let active = true;
    apiInstance
      .get("/admin/auth/status")
      .then((res) => {
        if (active && res.data.setupRequired) setSetupRequired(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiInstance.post("/admin/auth/login", form);
      dispatch(
        loginSuccess({
          accessToken: response.data.accessToken,
          user: response.data.user,
        })
      );
      notify.success("Welcome back! Signed in to admin panel.");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      notify.fromError(err, "Admin login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-portal">
      <div className="admin-portal-card">
        <p className="admin-portal-eyebrow">MultiCommerce</p>
        <h1>Admin Portal</h1>
        <p className="admin-portal-lead">
          Super Admin access only. Customers and vendors use the shop login.
        </p>

        {setupRequired && (
          <div className="admin-portal-banner">
            No admin account yet.{" "}
            <Link to="/admin/setup">Create the first Super Admin</Link>
          </div>
        )}

        <form className="admin-portal-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            autoComplete="username"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            autoComplete="current-password"
          />

          <p className="admin-portal-forgot">
            <Link to="/admin/forgot-password">Forgot password?</Link>
          </p>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in to Admin"}
          </button>
        </form>

        <p className="admin-portal-footer">
          <PortalLink portal="customer" to="/login">
            Customer login
          </PortalLink>
          {" · "}
          <PortalLink portal="vendor" to="/vendor/login">
            Vendor login
          </PortalLink>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
