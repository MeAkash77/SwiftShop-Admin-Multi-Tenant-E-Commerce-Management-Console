import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import apiInstance from "../../api/apiInstaince";
import { loginSuccess } from "../../features/user/userSlice";
import PortalLink from "../../components/PortalLink";
import { openPortalInNewTab } from "../../utils/portal";
import "./VendorPortal.css";
import { notify } from "../../utils/notify";

const VendorLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiInstance.post("/vendor/auth/login", form);
      dispatch(
        loginSuccess({
          accessToken: response.data.accessToken,
          user: response.data.user,
        })
      );
      notify.success("Welcome back! Signed in to vendor panel.");
      navigate("/vendor", { replace: true });
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        notify.fromError(err);
        navigate(
          `/verify-email?email=${encodeURIComponent(
            err.response.data.email || form.email
          )}&portal=vendor`
        );
        return;
      }
      if (err.response?.data?.useCustomerLogin) {
        notify.fromError(err);
        if (!openPortalInNewTab("customer", "/login")) {
          navigate("/login");
        }
        return;
      }
      notify.fromError(err, "Vendor login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vendor-portal">
      <div className="vendor-portal-card">
        <p className="vendor-portal-eyebrow">Seller admin</p>
        <h1>Vendor Login</h1>
        <p className="vendor-portal-lead">
          Manage your store, products, orders, and payments. Customers shop via the
          main login.
        </p>

        <form className="vendor-portal-form" onSubmit={handleSubmit}>
          <label htmlFor="vendor-email">Email</label>
          <input
            id="vendor-email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            autoComplete="username"
          />

          <label htmlFor="vendor-password">Password</label>
          <input
            id="vendor-password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            autoComplete="current-password"
          />

          <p className="vendor-portal-forgot">
            <Link to="/vendor/forgot-password">Forgot password?</Link>
          </p>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in as Vendor"}
          </button>
        </form>

        <p className="vendor-portal-footer">
          New seller? <Link to="/vendor/register">Register your store account</Link>
          <br />
          <Link to="/vendor/info/terms">Seller terms & payouts</Link>
          {" · "}
          <PortalLink portal="customer" to="/login">
            Customer login
          </PortalLink>
          {" · "}
          <PortalLink portal="admin" to="/admin/login">
            Admin portal
          </PortalLink>
        </p>
      </div>
    </div>
  );
};

export default VendorLogin;
