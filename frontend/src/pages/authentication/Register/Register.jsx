import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiInstance from "../../../api/apiInstaince.js";
import AuthLayout from "../../../layouts/AuthLayout";
import PortalLink from "../../../components/PortalLink";
import { openPortalInNewTab } from "../../../utils/portal";
import { notify } from "../../../utils/notify";

const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const Register = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "customer",
  });

  function updateUserDetails(event) {
    const { name, value } = event.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!userDetails.firstName.trim()) next.firstName = "First name is required.";
    if (!userDetails.lastName.trim()) next.lastName = "Last name is required.";
    if (!userDetails.email.trim()) next.email = "Email is required.";
    else if (!emailOk(userDetails.email)) next.email = "Enter a valid email address.";
    if (!userDetails.password) next.password = "Password is required.";
    else if (userDetails.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    if (!userDetails.phoneNumber.trim()) next.phoneNumber = "Phone number is required.";
    else if (!/^[0-9+\-\s()]{8,15}$/.test(userDetails.phoneNumber.trim())) {
      next.phoneNumber = "Enter a valid phone number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await apiInstance.post("/auth/register", {
        ...userDetails,
        role: "customer",
      });
      if (response.status === 200 || response.status === 201) {
        notify.success(response.data.message || "Account created — check your email for OTP.");
        navigate(
          `/verify-email?email=${encodeURIComponent(userDetails.email)}&portal=customer`
        );
        setUserDetails({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phoneNumber: "",
          role: "customer",
        });
      }
    } catch (err) {
      notify.fromError(err, "Registration failed.");
      if (err.response?.data?.useVendorPortal) {
        if (!openPortalInNewTab("vendor", "/vendor/register")) {
          navigate("/vendor/register");
        }
        return;
      }
      if (err.response?.status === 409) {
        navigate("/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Looks like you're new here!"
      subtitle="Sign up with your email to get started"
      wide
    >
      <h2>Create Account</h2>
      <p className="fk-auth-lead">Join MultiCommerce as a customer — browse now, buy after login.</p>

      <form className="fk-auth-form" onSubmit={handleSubmit} noValidate>
        <div className="fk-auth-row">
          <div className={`fk-auth-field ${errors.firstName ? "has-error" : ""}`}>
            <label htmlFor="reg-firstName">First Name</label>
            <input
              id="reg-firstName"
              type="text"
              name="firstName"
              placeholder="First name"
              value={userDetails.firstName}
              onChange={updateUserDetails}
              required
              autoComplete="given-name"
            />
            {errors.firstName ? (
              <p className="fk-auth-field-error">{errors.firstName}</p>
            ) : null}
          </div>
          <div className={`fk-auth-field ${errors.lastName ? "has-error" : ""}`}>
            <label htmlFor="reg-lastName">Last Name</label>
            <input
              id="reg-lastName"
              type="text"
              name="lastName"
              placeholder="Last name"
              value={userDetails.lastName}
              onChange={updateUserDetails}
              required
              autoComplete="family-name"
            />
            {errors.lastName ? (
              <p className="fk-auth-field-error">{errors.lastName}</p>
            ) : null}
          </div>
        </div>

        <div className={`fk-auth-field ${errors.email ? "has-error" : ""}`}>
          <label htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={userDetails.email}
            onChange={updateUserDetails}
            required
            autoComplete="email"
          />
          {errors.email ? <p className="fk-auth-field-error">{errors.email}</p> : null}
        </div>

        <div className={`fk-auth-field fk-auth-password ${errors.password ? "has-error" : ""}`}>
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="At least 6 characters"
            value={userDetails.password}
            onChange={updateUserDetails}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="fk-auth-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
          </button>
          {errors.password ? (
            <p className="fk-auth-field-error">{errors.password}</p>
          ) : (
            <p className="fk-auth-hint">Use at least 6 characters.</p>
          )}
        </div>

        <div className={`fk-auth-field ${errors.phoneNumber ? "has-error" : ""}`}>
          <label htmlFor="reg-phone">Phone Number</label>
          <input
            id="reg-phone"
            type="tel"
            name="phoneNumber"
            placeholder="10-digit mobile number"
            value={userDetails.phoneNumber}
            onChange={updateUserDetails}
            required
            autoComplete="tel"
          />
          {errors.phoneNumber ? (
            <p className="fk-auth-field-error">{errors.phoneNumber}</p>
          ) : (
            <p className="fk-auth-hint">Used for delivery updates.</p>
          )}
        </div>

        <label className="fk-auth-check">
          <input type="checkbox" required />
          <span>
            I agree to the{" "}
            <Link className="fk-auth-link" to="/customer/info/terms">
              Terms of Use
            </Link>{" "}
            &{" "}
            <Link className="fk-auth-link" to="/customer/info/privacy">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button className="fk-auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="fk-auth-note">
          Want to sell?{" "}
          <PortalLink className="fk-auth-link" portal="vendor" to="/vendor/register">
            Register as a vendor
          </PortalLink>
        </p>

        <div className="fk-auth-footer">
          Existing User? <Link to="/login">Log in</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
