import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import apiInstance from "../../api/apiInstaince";
import { logout } from "../../features/user/userSlice";
import useNotify from "../../hooks/useNotify";
import "../../layouts/PanelLayout.css";

/**
 * Change password for admin / vendor panels.
 * After success, session is cleared (backend invalidates refresh token).
 */
const ChangePasswordPage = ({
  roleLabel = "Account",
  loginPath = "/login",
  logoutEndpoint = "/auth/logout",
}) => {
  const notify = useNotify();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      notify.error("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      notify.error("New password and confirm password do not match.");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      notify.warning("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiInstance.patch("/auth/changePassword", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      notify.success(
        response.data.message || "Password changed successfully. Please sign in again."
      );
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      try {
        await apiInstance.post(logoutEndpoint);
      } catch {
        // session already cleared on server
      }
      dispatch(logout());
      navigate(loginPath, { replace: true });
    } catch (err) {
      notify.fromError(err, "Password change failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Change Password</h2>
        <p className="page-subtitle">
          Update your {roleLabel.toLowerCase()} password. You will be signed out after a
          successful change.
        </p>
      </div>

      <div className="form-card" style={{ maxWidth: 480 }}>
        <form className="panel-form" onSubmit={handleSubmit}>
          <label className="muted">
            Current password
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={onChange}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="muted">
            New password
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={onChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label className="muted">
            Confirm new password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <button className="panel-btn" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
