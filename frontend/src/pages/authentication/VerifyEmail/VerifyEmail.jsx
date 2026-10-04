import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import apiInstance from "../../../api/apiInstaince";
import AuthLayout from "../../../layouts/AuthLayout";
import { notify } from "../../../utils/notify";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const portal = searchParams.get("portal") || "customer";
  const loginPath =
    portal === "vendor"
      ? "/vendor/login"
      : portal === "admin"
        ? "/admin/login"
        : "/login";
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: searchParams.get("email") || "",
    otp: "",
  });

  function updateField(event) {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiInstance.post("/auth/verify-email", formData);
      if (response.status === 200) {
        notify.success(response.data.message || "Email verified successfully.");
        navigate(loginPath);
      }
    } catch (err) {
      notify.fromError(err, "Invalid or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Verify Email"
      subtitle="Enter the OTP sent to your inbox to activate your account"
    >
      <h2>Email verification</h2>
      <p className="fk-auth-lead">Check your email for the 6-digit OTP</p>

      <form className="fk-auth-form" onSubmit={handleSubmit}>
        <div className="fk-auth-field">
          <label htmlFor="verify-email">Email Address</label>
          <input
            id="verify-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={updateField}
            placeholder="Enter Email"
            required
          />
        </div>

        <div className="fk-auth-field">
          <label htmlFor="verify-otp">OTP</label>
          <input
            id="verify-otp"
            type="text"
            name="otp"
            value={formData.otp}
            onChange={updateField}
            placeholder="Enter 6-digit OTP"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>

        <button className="fk-auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Verifying..." : "Verify Email"}
        </button>

        <div className="fk-auth-footer">
          Already verified? <Link to={loginPath}>Log in</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmail;
