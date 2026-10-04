import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import apiInstance from "../../../api/apiInstaince";
import AuthLayout from "../../../layouts/AuthLayout";
import { notify } from "../../../utils/notify";
import "../../admin/AdminPortal.css";
import "../../vendor/VendorPortal.css";

const LOGIN_BY_PORTAL = {
  customer: "/login",
  vendor: "/vendor/login",
  admin: "/admin/login",
};

/**
 * Shared reset-password page. Portal comes from email link (?portal=) or API response.
 */
const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const portalHint = String(searchParams.get("portal") || "customer").toLowerCase();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loginPath = useMemo(
    () => LOGIN_BY_PORTAL[portalHint] || LOGIN_BY_PORTAL.customer,
    [portalHint]
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.length < 6) {
      notify.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      notify.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiInstance.patch(`/auth/resetPassword/${token}`, {
        password,
      });

      notify.success(
        response.data.message || "Password reset successful. Please sign in."
      );
      const nextLogin =
        response.data.loginPath ||
        LOGIN_BY_PORTAL[response.data.portal] ||
        loginPath;
      navigate(nextLogin, { replace: true });
    } catch (err) {
      notify.fromError(err, "Invalid or expired reset link.");
    } finally {
      setSubmitting(false);
    }
  }

  const formFields = (
    <>
      <label htmlFor="reset-password">New Password</label>
      <input
        id="reset-password"
        type="password"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New Password"
        minLength={6}
        required
        autoComplete="new-password"
      />

      <label htmlFor="reset-confirm">Confirm Password</label>
      <input
        id="reset-confirm"
        type="password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm Password"
        minLength={6}
        required
        autoComplete="new-password"
      />
    </>
  );

  if (portalHint === "admin") {
    return (
      <div className="admin-portal">
        <div className="admin-portal-card">
          <p className="admin-portal-eyebrow">MultiCommerce</p>
          <h1>Reset Admin Password</h1>
          <p className="admin-portal-lead">Choose a new password (min 6 characters).</p>
          <form className="admin-portal-form" onSubmit={handleSubmit}>
            {formFields}
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Reset Password"}
            </button>
          </form>
          <p className="admin-portal-footer">
            Back to <Link to={loginPath}>Admin login</Link>
          </p>
        </div>
      </div>
    );
  }

  if (portalHint === "vendor") {
    return (
      <div className="vendor-portal">
        <div className="vendor-portal-card">
          <p className="vendor-portal-eyebrow">Seller Hub</p>
          <h1>Reset Vendor Password</h1>
          <p className="vendor-portal-lead">Choose a new password (min 6 characters).</p>
          <form className="vendor-portal-form" onSubmit={handleSubmit}>
            {formFields}
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Reset Password"}
            </button>
          </form>
          <p className="vendor-portal-footer">
            Back to <Link to={loginPath}>Vendor login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new password for your MultiCommerce account"
    >
      <h2>Choose a new password</h2>
      <p className="fk-auth-lead">Use at least 6 characters</p>

      <form className="fk-auth-form" onSubmit={handleSubmit}>
        <div className="fk-auth-field">
          <label htmlFor="reset-password">New Password</label>
          <input
            id="reset-password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New Password"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="fk-auth-field">
          <label htmlFor="reset-confirm">Confirm Password</label>
          <input
            id="reset-confirm"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm Password"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </div>

        <button className="fk-auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Reset Password"}
        </button>

        <div className="fk-auth-footer">
          Back to <Link to={loginPath}>Login</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
