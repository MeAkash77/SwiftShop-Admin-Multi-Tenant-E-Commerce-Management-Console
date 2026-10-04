import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiInstance from "../../api/apiInstaince";
import "./VendorPortal.css";
import { notify } from "../../utils/notify";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
};

const VendorRegister = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!acceptedTerms) {
      notify.error("Please accept the Seller Terms & payout policy to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiInstance.post("/vendor/auth/register", form);
      notify.success(response.data.message || "Registration successful!");
      navigate(
        `/verify-email?email=${encodeURIComponent(form.email)}&portal=vendor`
      );
      setForm(emptyForm);
      setAcceptedTerms(false);
    } catch (err) {
      const message = err.response?.data?.message || "Vendor registration failed.";
      notify.error(message);
      if (err.response?.data?.useVendorLogin || err.response?.status === 409) {
        navigate("/vendor/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vendor-portal">
      <div className="vendor-portal-card wide">
        <p className="vendor-portal-eyebrow">Become a seller</p>
        <h1>Vendor Registration</h1>
        <p className="vendor-portal-lead">
          Create a seller account to set up your storefront and sell on MultiCommerce.
        </p>

        <form className="vendor-portal-form" onSubmit={handleSubmit}>
          <div className="vendor-portal-row">
            <div>
              <label htmlFor="vr-firstName">First name</label>
              <input
                id="vr-firstName"
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label htmlFor="vr-lastName">Last name</label>
              <input
                id="vr-lastName"
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <label htmlFor="vr-email">Business email</label>
          <input
            id="vr-email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            autoComplete="email"
          />

          <label htmlFor="vr-phone">Phone number</label>
          <input
            id="vr-phone"
            type="tel"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
            required
          />

          <label htmlFor="vr-password">Password</label>
          <input
            id="vr-password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
            autoComplete="new-password"
          />

          <label className="vendor-portal-check" htmlFor="vr-terms">
            <input
              id="vr-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <span>
              I agree to the{" "}
              <Link to="/vendor/info/terms" target="_blank" rel="noreferrer">
                Seller Terms & payout policy
              </Link>{" "}
              (weekly bank settlement and anytime withdrawals).
            </span>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Vendor Account"}
          </button>
        </form>

        <p className="vendor-portal-footer">
          Already a seller? <Link to="/vendor/login">Vendor login</Link>
          <br />
          Shopping instead? <Link to="/register">Customer sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default VendorRegister;
