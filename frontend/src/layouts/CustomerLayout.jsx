import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/user/userSlice";
import apiInstance from "../api/apiInstaince";
import { categoryApi } from "../api/services";
import { getCategoryIcon } from "../utils/categoryIcons";
import CustomerSupportChat from "../components/chat/CustomerSupportChat";
import NotificationBell from "../components/notifications/NotificationBell";
import PortalLink from "../components/PortalLink";
import { PageLoader } from "../components/shop/LoadingStates";
import {
  readShopCache,
  writeShopCache,
  SHOP_CACHE_KEYS,
} from "../utils/shopBootstrapCache";

const accountMenu = [
  { to: "/customer/account/profile", label: "My Profile", icon: "fa-solid fa-user" },
  { to: "/customer/orders", label: "Orders", icon: "fa-solid fa-box" },
  { to: "/customer/account/notifications", label: "Notifications", icon: "fa-solid fa-bell" },
  { to: "/customer/payments", label: "Payments", icon: "fa-solid fa-credit-card" },
  { to: "/customer/account/wishlist", label: "Wishlist", icon: "fa-solid fa-heart" },
  { to: "/customer/account/coupons", label: "Coupons", icon: "fa-solid fa-ticket" },
];

const moreMenu = [
  { to: "/customer/info/contact", label: "Customer Care", icon: "fa-solid fa-headset" },
  { to: "/customer/info/help-center", label: "Help Center", icon: "fa-solid fa-circle-question" },
  { to: "/customer/info/advertise", label: "Advertise", icon: "fa-solid fa-bullhorn" },
  {
    to: "/vendor/register",
    label: "Become a Seller",
    icon: "fa-solid fa-store",
    portal: "vendor",
  },
];

const CustomerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const token = useSelector((state) => state.user.token);
  const isCustomer = Boolean(isAuthenticated && token && user?.role === "customer");
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useSelector((state) => state.wishlist.items.length);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState(
    () => readShopCache(SHOP_CACHE_KEYS.categories) || []
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const accountRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => {
        const list = res.data?.data || [];
        setCategories(list);
        writeShopCache(SHOP_CACHE_KEYS.categories, list);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    function onDocClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    }

    function onEsc(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function handleLogout() {
    try {
      await apiInstance.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      setAccountOpen(false);
      dispatch(logout());
      navigate("/login");
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/customer/products?q=${encodeURIComponent(q)}` : "/customer/products");
  }

  function toggleAccount() {
    setAccountOpen((open) => !open);
    setMoreOpen(false);
  }

  function toggleMore() {
    setMoreOpen((open) => !open);
    setAccountOpen(false);
  }

  return (
    <div className="shop-shell shop-shell--cx min-h-screen bg-fk-bg text-fk-text font-sans">
      <header className="cx-header sticky top-0 z-[100]">
        <div className="cx-header-inner max-w-[1280px] mx-auto px-5 py-3.5 flex items-center gap-5 max-[900px]:flex-wrap max-[900px]:gap-3">
          <Link to="/customer" className="cx-brand no-underline shrink-0">
            MultiCommerce
          </Link>

          <form className="cx-search flex-1 flex max-w-[560px] max-[900px]:order-3 max-[900px]:max-w-none max-[900px]:w-full" onSubmit={handleSearch}>
            <input
              className="flex-1 border-0 outline-none bg-transparent py-2.5 px-3.5 text-[0.95rem] font-[inherit] text-fk-text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, and more"
              aria-label="Search products"
            />
            <button type="submit" className="cx-search-btn" aria-label="Search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </button>
          </form>

          <div className="cx-header-actions flex items-center gap-1 ml-auto">
            {isCustomer ? (
              <div className="cx-bell">
                <NotificationBell listPath="/customer/account/notifications" />
              </div>
            ) : null}

            {isCustomer ? (
              <div className={`shop-menu ${accountOpen ? "is-open" : ""}`} ref={accountRef}>
                <button
                  type="button"
                  className="cx-nav-btn shop-menu-trigger"
                  onClick={toggleAccount}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <i className="fa-solid fa-user" aria-hidden="true" />
                  <span className="max-[640px]:hidden">{user?.firstName || "Account"}</span>
                  <i className={`fa-solid fa-chevron-${accountOpen ? "up" : "down"} text-[0.65rem]`} aria-hidden="true" />
                </button>

                <div className="shop-dropdown" role="menu" hidden={!accountOpen}>
                  <div className="shop-dropdown-hello">
                    <p>Hello, {user?.firstName || "Customer"}</p>
                    <Link to="/customer/account/profile" onClick={() => setAccountOpen(false)}>
                      My Account
                    </Link>
                  </div>
                  {accountMenu.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="shop-dropdown-item"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      <i className={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.label === "Wishlist" && wishlistCount > 0 ? (
                        <em>{wishlistCount}</em>
                      ) : null}
                    </Link>
                  ))}
                  <button type="button" className="shop-dropdown-item" role="menuitem" onClick={handleLogout}>
                    <i className="fa-solid fa-power-off" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  className="cx-nav-btn"
                  to="/login"
                  state={{ from: { pathname: "/customer" } }}
                >
                  Login
                </Link>
                <Link className="cx-nav-cta" to="/register">
                  Sign up
                </Link>
              </>
            )}

            <div className={`shop-menu ${moreOpen ? "is-open" : ""}`} ref={moreRef}>
              <button
                type="button"
                className="cx-nav-btn shop-menu-trigger max-[640px]:hidden"
                onClick={toggleMore}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                More
                <i className={`fa-solid fa-chevron-${moreOpen ? "up" : "down"} text-[0.65rem]`} aria-hidden="true" />
              </button>

              <div className="shop-dropdown shop-dropdown-more" role="menu" hidden={!moreOpen}>
                {moreMenu.map((item) =>
                  item.portal ? (
                    <PortalLink
                      key={item.label}
                      portal={item.portal}
                      to={item.to}
                      className="shop-dropdown-item"
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                    >
                      <i className={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </PortalLink>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="shop-dropdown-item"
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                    >
                      <i className={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  )
                )}
              </div>
            </div>

            <Link
              className="cx-nav-btn cx-cart-link relative"
              to={isCustomer ? "/customer/cart" : "/login"}
              state={isCustomer ? undefined : { from: { pathname: "/customer/cart" } }}
            >
              <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
              <span className="max-[640px]:hidden">Cart</span>
              {isCustomer && cartCount > 0 ? (
                <span className="shop-cart-badge">{cartCount}</span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <nav className="cx-cats" aria-label="Categories">
        <div className="max-w-[1280px] mx-auto px-5 py-2.5 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLink to="/customer/products" end className="shop-cat-item">
            <div className="icon">
              <i className="fa-solid fa-border-all" aria-hidden="true" />
            </div>
            <p>All</p>
          </NavLink>
          {categories.map((cat) => (
            <NavLink
              key={cat._id}
              to={`/customer/products?category=${cat.slug}`}
              className="shop-cat-item"
            >
              <div className="icon">
                <i className={getCategoryIcon(cat.slug)} aria-hidden="true" />
              </div>
              <p>{cat.name}</p>
            </NavLink>
          ))}
          <NavLink
            to={isCustomer ? "/customer/stores" : "/login"}
            state={isCustomer ? undefined : { from: { pathname: "/customer/stores" } }}
            className="shop-cat-item"
          >
            <div className="icon">
              <i className="fa-solid fa-store" aria-hidden="true" />
            </div>
            <p>Stores</p>
          </NavLink>
        </div>
      </nav>

      <main className="shop-main max-w-[1280px] mx-auto px-4 sm:px-5 pt-4 pb-12">
        {!isCustomer ? (
          <div className="shop-guest-banner">
            Browsing as guest.{" "}
            <Link to="/login" state={{ from: { pathname: "/customer" } }}>
              Login
            </Link>{" "}
            to use cart, orders, and account.
          </div>
        ) : null}
        <Suspense fallback={<PageLoader compact label="Loading this page" />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="cx-footer mt-auto">
        <div className="max-w-[1280px] mx-auto px-5 pt-10 pb-6 grid grid-cols-4 gap-8 text-sm max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          <div>
            <h4>About</h4>
            <Link to="/customer/info/about">About Us</Link>
            <Link to="/customer/info/careers">Careers</Link>
            <Link to="/customer/info/press">Press</Link>
            <Link to="/customer/info/sitemap">Sitemap</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link
              to={isCustomer ? "/customer/orders" : "/login"}
              state={isCustomer ? undefined : { from: { pathname: "/customer/orders" } }}
            >
              Track Order
            </Link>
            <Link
              to={isCustomer ? "/customer/payments" : "/login"}
              state={isCustomer ? undefined : { from: { pathname: "/customer/payments" } }}
            >
              My Payments
            </Link>
            <Link to="/customer/info/shipping">Shipping</Link>
            <Link to="/customer/info/returns">Returns</Link>
            <Link to="/customer/info/faq">FAQ</Link>
            <Link to="/customer/info/contact">Contact Us</Link>
          </div>
          <div>
            <h4>Policy</h4>
            <Link to="/customer/info/returns">Return Policy</Link>
            <Link to="/customer/info/terms">Terms of Use</Link>
            <Link to="/customer/info/privacy">Privacy</Link>
            <Link to="/customer/info/cancellation">Cancellation</Link>
          </div>
          <div>
            <h4>MultiCommerce</h4>
            <p>Ahmedabad, Gujarat, India</p>
            <Link to="/customer/info/contact">support@multicommerce.local</Link>
            <Link
              to={isCustomer ? "/customer/account/profile" : "/login"}
              state={isCustomer ? undefined : { from: { pathname: "/customer/account/profile" } }}
            >
              My Account
            </Link>
          </div>
        </div>
        <div className="cx-footer-bar max-w-[1280px] mx-auto px-5 py-5 flex flex-wrap gap-x-6 gap-y-3 items-center text-sm">
          <PortalLink portal="vendor" to="/vendor/register">
            Become a Seller
          </PortalLink>
          <Link to="/customer/info/advertise">Advertise</Link>
          <Link to="/customer/info/gift-cards">Gift Cards</Link>
          <Link to="/customer/info/help-center">Help Center</Link>
          <span className="ml-auto opacity-70">© {new Date().getFullYear()} MultiCommerce</span>
        </div>
      </footer>

      <CustomerSupportChat />
    </div>
  );
};

export default CustomerLayout;
