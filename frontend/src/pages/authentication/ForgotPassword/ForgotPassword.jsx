import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiInstance from "../../../api/apiInstaince";
import AuthLayout from "../../../layouts/AuthLayout";
import { notify } from "../../../utils/notify";
import "../../admin/AdminPortal.css";
import "../../vendor/VendorPortal.css";

const PORTAL_CONFIG = {
  customer: {
    label: "Customer",
    loginPath: "/login",
    title: "Forgot Password",
    subtitle: "Enter your email and we will send a reset link",
  },
  vendor: {
    label: "Vendor",
    loginPath: "/vendor/login",
    title: "Vendor Forgot Password",
    subtitle: "Reset access to your seller account",
  },
  admin: {
    label: "Admin",
    loginPath: "/admin/login",
    title: "Admin Forgot Password",
    subtitle: "Reset Super Admin portal access",
  },
};

const PORTAL_FORGOT_PATH = {
  customer: "/forgot-password",
  vendor: "/vendor/forgot-password",
  admin: "/admin/forgot-password",
};

/**
 * Shared forgot-password form for customer, vendor, and admin portals.
 */
const ForgotPassword = ({ portal = "customer" }) => {
  const navigate = useNavigate();
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.customer;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiInstance.post("/auth/forgotPassword", {
        email: email.trim().toLowerCase(),
        portal,
      });
      notify.success(
        response.data.message || "Password reset link sent to your email."
      );
      setEmail("");
    } catch (err) {
      const usePortal = err.response?.data?.usePortal;
      if (usePortal && usePortal !== portal) {
        notify.fromError(err);
        navigate(PORTAL_FORGOT_PATH[usePortal] || "/forgot-password");
        return;
      }
      notify.fromError(err, "Unable to send reset link.");
    } finally {
      setSubmitting(false);
    }
  }

  if (portal === "admin") {
    return (
      <div className="admin-portal">
        <div className="admin-portal-card">
          <p className="admin-portal-eyebrow">MultiCommerce</p>
          <h1>{config.title}</h1>
          <p className="admin-portal-lead">{config.subtitle}</p>
          <form className="admin-portal-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-forgot-email">Admin email</label>
            <input
              id="admin-forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <p className="admin-portal-footer">
            Remember password? <Link to={config.loginPath}>Admin login</Link>
          </p>
        </div>
      </div>
    );
  }

  if (portal === "vendor") {
    return (
      <div className="vendor-portal">
        <div className="vendor-portal-card">
          <p className="vendor-portal-eyebrow">Seller Hub</p>
          <h1>{config.title}</h1>
          <p className="vendor-portal-lead">{config.subtitle}</p>
          <form className="vendor-portal-form" onSubmit={handleSubmit}>
            <label htmlFor="vendor-forgot-email">Vendor email</label>
            <input
              id="vendor-forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <p className="vendor-portal-footer">
            Remember password? <Link to={config.loginPath}>Vendor login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title={config.title} subtitle={config.subtitle}>
      <h2>Reset your password</h2>
      <p className="fk-auth-lead">We will email you a secure reset link</p>

      <form className="fk-auth-form" onSubmit={handleSubmit}>
        <div className="fk-auth-field">
          <label htmlFor="forgot-email">Email Address</label>
          <input
            id="forgot-email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter Email"
            required
            autoComplete="email"
          />
        </div>

        <button className="fk-auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="fk-auth-footer">
          Remember password? <Link to={config.loginPath}>Log in</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
