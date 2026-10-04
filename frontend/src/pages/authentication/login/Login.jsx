import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import apiInstance from "../../../api/apiInstaince";
import { loginSuccess } from "../../../features/user/userSlice";
import AuthLayout from "../../../layouts/AuthLayout";
import PortalLink from "../../../components/PortalLink";
import { openPortalInNewTab } from "../../../utils/portal";
import { notify } from "../../../utils/notify";

const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });

  function submitDetails(event) {
    const { name, value } = event.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!userData.email.trim()) next.email = "Email is required.";
    else if (!emailOk(userData.email)) next.email = "Enter a valid email address.";
    if (!userData.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await apiInstance.post("/auth/login", userData);
      if (response.status === 200) {
        dispatch(
          loginSuccess({
            accessToken: response.data.accessToken,
            user: response.data.user,
          })
        );
        notify.success("Welcome back!");

        const redirectTo = location.state?.from?.pathname;
        if (redirectTo?.startsWith("/customer")) {
          navigate(redirectTo);
        } else {
          navigate("/customer");
        }
      }
    } catch (err) {
      if (err.response?.data?.useAdminPortal) {
        notify.info(err.response.data.message || "Use the admin portal to sign in.");
        if (!openPortalInNewTab("admin", "/admin/login")) {
          navigate("/admin/login");
        }
        return;
      }
      if (err.response?.data?.useVendorPortal) {
        notify.info(err.response.data.message || "Use the seller portal to sign in.");
        if (!openPortalInNewTab("vendor", "/vendor/login")) {
          navigate("/vendor/login");
        }
        return;
      }
      if (err.response?.data?.requiresVerification) {
        notify.warning(err.response.data.message || "Please verify your email first.");
        navigate(
          `/verify-email?email=${encodeURIComponent(
            err.response.data.email || userData.email
          )}`
        );
        return;
      }
      notify.fromError(err, "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Orders, wishlist, and recommendations in one place."
    >
      <h2>Welcome back</h2>
      <p className="fk-auth-lead">
        Enter your details to continue shopping
        {location.state?.from?.pathname?.startsWith("/customer")
          ? " — we'll take you back where you left off."
          : "."}
      </p>

      <form className="fk-auth-form" onSubmit={handleSubmit} noValidate>
        <div className={`fk-auth-field ${errors.email ? "has-error" : ""}`}>
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            value={userData.email}
            onChange={submitDetails}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          {errors.email ? <p className="fk-auth-field-error">{errors.email}</p> : null}
        </div>

        <div className={`fk-auth-field fk-auth-password ${errors.password ? "has-error" : ""}`}>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={userData.password}
            onChange={submitDetails}
            placeholder="Enter password"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="fk-auth-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
          </button>
          {errors.password ? <p className="fk-auth-field-error">{errors.password}</p> : null}
        </div>

        <div className="fk-auth-actions">
          <Link className="fk-auth-link" to="/forgot-password">
            Forgot Password?
          </Link>
        </div>

        <button className="fk-auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="fk-auth-note">
          By continuing, you agree to MultiCommerce Terms of Use and Privacy Policy.
        </p>

        <div className="fk-auth-footer">
          New to MultiCommerce? <Link to="/register">Create an account</Link>
          <br />
          <Link to="/customer">Continue browsing as guest</Link>
          {" · "}
          <PortalLink portal="vendor" to="/vendor/login">
            Seller login
          </PortalLink>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
