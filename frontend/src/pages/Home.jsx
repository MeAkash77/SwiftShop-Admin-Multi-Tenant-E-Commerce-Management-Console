import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/user/userSlice";
import { getCategoryIcon } from "../utils/categoryIcons";
import PortalLink from "../components/PortalLink";

const roleHome = {
  superAdmin: "/admin/dashboard",
  vendor: "/vendor",
  customer: "/customer",
};

const roleLabel = {
  superAdmin: "admin",
  vendor: "vendor",
  customer: "shop",
};

const START_CATEGORIES = [
  { slug: "electronics", name: "Electronics" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home", name: "Home" },
  { slug: "beauty", name: "Beauty" },
];

const Home = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dashboardPath = roleHome[user?.role] || "/customer";
  const panelLabel = roleLabel[user?.role] || "account";

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="MultiCommerce home">
          MultiCommerce
        </Link>
        <nav className="landing-nav-links" aria-label="Landing">
          <Link to="/customer">Shop</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <PortalLink portal="vendor" to="/vendor/register">
                Sell
              </PortalLink>
              <Link className="landing-nav-cta" to="/register">
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath}>Dashboard</Link>
              <button
                type="button"
                className="landing-nav-cta"
                onClick={() => dispatch(logout())}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-brand-title">
        <div className="landing-hero-bg" aria-hidden="true" />
        <div className="landing-hero-inner">
          <p className="landing-hero-brand" id="landing-brand-title">
            MultiCommerce
          </p>
          <h1 className="landing-hero-headline">
            {isAuthenticated
              ? `Welcome back, ${user?.firstName || "friend"}`
              : "Many stores. One calm place to shop."}
          </h1>
          <p className="landing-hero-lead">
            {isAuthenticated
              ? `Continue to your ${panelLabel} or browse the marketplace.`
              : "Browse freely across trusted sellers. Sign in only when you are ready to buy."}
          </p>
          <div className="landing-hero-actions">
            {isAuthenticated ? (
              <>
                <Link className="landing-btn landing-btn-primary" to={dashboardPath}>
                  Open {panelLabel}
                </Link>
                <Link className="landing-btn landing-btn-ghost" to="/customer">
                  Browse shop
                </Link>
              </>
            ) : (
              <>
                <Link className="landing-btn landing-btn-primary" to="/customer">
                  Start shopping
                </Link>
                <PortalLink
                  className="landing-btn landing-btn-ghost"
                  portal="vendor"
                  to="/vendor/register"
                >
                  Become a seller
                </PortalLink>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="landing-trust" aria-label="Why shop with us">
        <div className="landing-trust-inner">
          <div className="landing-trust-item">
            <span className="landing-trust-label">Delivery</span>
            <p>Tracked fulfillment from sellers across India.</p>
          </div>
          <div className="landing-trust-item">
            <span className="landing-trust-label">Checkout</span>
            <p>Pay safely with Razorpay or cash on delivery.</p>
          </div>
          <div className="landing-trust-item">
            <span className="landing-trust-label">Returns</span>
            <p>Simple returns on eligible orders.</p>
          </div>
        </div>
      </section>

      <section className="landing-start" aria-labelledby="landing-start-title">
        <div className="landing-start-inner">
          <h2 className="landing-start-head" id="landing-start-title">
            Start shopping
          </h2>
          <p className="landing-start-lead">
            Jump into popular categories — no account needed to browse.
          </p>
          <div className="landing-cats">
            {START_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                className="landing-cat"
                to={`/customer/products?category=${cat.slug}`}
              >
                <i className={getCategoryIcon(cat.slug)} aria-hidden="true" />
                {cat.name}
              </Link>
            ))}
            <Link className="landing-cat landing-cat--all" to="/customer/products">
              View all
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div>
            <strong>MultiCommerce</strong>
            <p>Shop many stores in one place.</p>
          </div>
          <div className="landing-footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Create account</Link>
            <PortalLink portal="vendor" to="/vendor/register">
              Become a seller
            </PortalLink>
            <Link to="/customer/info/terms">Terms</Link>
            <Link to="/customer/info/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
