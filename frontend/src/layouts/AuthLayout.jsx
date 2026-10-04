import { Link } from "react-router-dom";

const AuthLayout = ({
  title = "Login",
  subtitle = "Orders, wishlist, and recommendations in one place.",
  children,
  wide = false,
}) => {
  return (
    <div className="fk-auth-shell">
      <header className="fk-auth-topbar">
        <Link to="/" className="fk-auth-logo" aria-label="MultiCommerce home">
          MultiCommerce
        </Link>
        <nav className="fk-auth-top-links" aria-label="Account">
          <Link to="/customer">Shop</Link>
          <Link to="/login">Login</Link>
          <Link className="fk-auth-top-cta" to="/register">
            Sign up
          </Link>
        </nav>
      </header>

      <main className={`fk-auth-card ${wide ? "is-wide" : ""}`}>
        <aside className="fk-auth-aside">
          <p className="fk-auth-aside-brand">MultiCommerce</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <ul className="fk-auth-perks">
            <li>
              <span>Delivery</span>
              Fast fulfillment across India
            </li>
            <li>
              <span>Payments</span>
              Razorpay or cash on delivery
            </li>
            <li>
              <span>Returns</span>
              Simple returns on eligible orders
            </li>
          </ul>
        </aside>

        <section className="fk-auth-panel">{children}</section>
      </main>
    </div>
  );
};

export default AuthLayout;
