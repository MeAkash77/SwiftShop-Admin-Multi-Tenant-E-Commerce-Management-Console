/**
 * App routes — customer shop, vendor workspace, admin panel.
 * Pages are lazy-loaded so the first paint only downloads what the user needs.
 * ProtectedRoute enforces roles; bootstrapSession restores JWT on load.
 * Architecture: docs/05-FRONTEND-ARCHITECTURE.md
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import ToastContainer from "./components/notifications/ToastContainer";
import DevPortalHome from "./components/DevPortalHome";
import PortalSwitchGuard from "./components/PortalSwitchGuard";
import { PageLoader } from "./components/shop/LoadingStates";
import { resolvePortal } from "./utils/portal";
import { bootstrapSession } from "./api/apiInstaince";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/authentication/Register/Register"));
const Login = lazy(() => import("./pages/authentication/login/Login"));
const ForgotPassword = lazy(() =>
  import("./pages/authentication/ForgotPassword/ForgotPassword")
);
const ResetPassword = lazy(() =>
  import("./pages/authentication/ResetPassword/ResetPassword")
);
const VerifyEmail = lazy(() =>
  import("./pages/authentication/VerifyEmail/VerifyEmail")
);

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const VendorLayout = lazy(() => import("./layouts/VendorLayout"));
const CustomerLayout = lazy(() => import("./layouts/CustomerLayout"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminStores = lazy(() => import("./pages/admin/AdminStores"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerDetail = lazy(() => import("./pages/admin/AdminCustomerDetail"));
const AdminStoreDetail = lazy(() => import("./pages/admin/AdminStoreDetail"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminSetup = lazy(() => import("./pages/admin/AdminSetup"));

const VendorLogin = lazy(() => import("./pages/vendor/VendorLogin"));
const VendorRegister = lazy(() => import("./pages/vendor/VendorRegister"));
const VendorTermsPublic = lazy(() => import("./pages/vendor/VendorTermsPublic"));
const VendorOverview = lazy(() => import("./pages/vendor/VendorOverview"));
const VendorStore = lazy(() => import("./pages/vendor/VendorStore"));
const VendorProducts = lazy(() => import("./pages/vendor/VendorProducts"));
const VendorMediaLibrary = lazy(() => import("./pages/vendor/VendorMediaLibrary"));
const VendorOrders = lazy(() => import("./pages/vendor/VendorOrders"));
const VendorSupport = lazy(() => import("./pages/vendor/VendorSupport"));
const VendorInventory = lazy(() => import("./pages/vendor/VendorInventory"));
const VendorProductTable = lazy(() => import("./pages/vendor/VendorProductTable"));
const VendorSettings = lazy(() => import("./pages/vendor/VendorSettings"));
const VendorShipping = lazy(() => import("./pages/vendor/VendorShipping"));
const VendorPayments = lazy(() => import("./pages/vendor/VendorPayments"));
const VendorPayouts = lazy(() => import("./pages/vendor/VendorPayouts"));
const VendorTerms = lazy(() => import("./pages/vendor/VendorTerms"));
const VendorGuide = lazy(() => import("./pages/vendor/VendorGuide"));
const VendorNotifications = lazy(() => import("./pages/vendor/VendorNotifications"));
const VendorReports = lazy(() => import("./pages/vendor/VendorReports"));

const StockAlerts = lazy(() => import("./pages/shared/StockAlerts"));
const CouponsManager = lazy(() => import("./pages/shared/CouponsManager"));
const ReviewsHub = lazy(() => import("./pages/shared/ReviewsHub"));
const MarketingBanners = lazy(() => import("./pages/shared/MarketingBanners"));
const ProfilePage = lazy(() => import("./pages/shared/ProfilePage"));
const ChangePasswordPage = lazy(() => import("./pages/shared/ChangePasswordPage"));

const CustomerHome = lazy(() => import("./pages/customer/CustomerHome"));
const CustomerStores = lazy(() => import("./pages/customer/CustomerStores"));
const CustomerStoreDetail = lazy(() => import("./pages/customer/CustomerStoreDetail"));
const CustomerProducts = lazy(() => import("./pages/customer/CustomerProducts"));
const CustomerProductDetail = lazy(() =>
  import("./pages/customer/CustomerProductDetail")
);
const CustomerCart = lazy(() => import("./pages/customer/CustomerCart"));
const CustomerOrders = lazy(() => import("./pages/customer/CustomerOrders"));
const CustomerPayments = lazy(() => import("./pages/customer/CustomerPayments"));
const CustomerAccountLayout = lazy(() =>
  import("./pages/customer/account/CustomerAccountLayout")
);
const AccountProfile = lazy(() => import("./pages/customer/account/AccountProfile"));
const AccountAddresses = lazy(() =>
  import("./pages/customer/account/AccountAddresses")
);
const AccountWishlist = lazy(() =>
  import("./pages/customer/account/AccountWishlist")
);
const AccountNotifications = lazy(() =>
  import("./pages/customer/account/AccountNotifications")
);
const AccountCoupons = lazy(() => import("./pages/customer/account/AccountCoupons"));
const AccountReviews = lazy(() => import("./pages/customer/account/AccountReviews"));

/** Named footer pages — lazy whole module, pick export. */
function lazyFooter(exportName) {
  return lazy(() =>
    import("./pages/customer/info/FooterPages").then((m) => ({
      default: m[exportName],
    }))
  );
}

const AboutPage = lazyFooter("AboutPage");
const CareersPage = lazyFooter("CareersPage");
const PressPage = lazyFooter("PressPage");
const ContactPage = lazyFooter("ContactPage");
const ReturnPolicyPage = lazyFooter("ReturnPolicyPage");
const TermsPage = lazyFooter("TermsPage");
const PrivacyPage = lazyFooter("PrivacyPage");
const ShippingPage = lazyFooter("ShippingPage");
const CancellationPage = lazyFooter("CancellationPage");
const FAQPage = lazyFooter("FAQPage");
const PaymentsHelpPage = lazyFooter("PaymentsHelpPage");
const AdvertisePage = lazyFooter("AdvertisePage");
const DownloadAppPage = lazyFooter("DownloadAppPage");
const GiftCardsInfoPage = lazyFooter("GiftCardsInfoPage");
const HelpCenterPage = lazyFooter("HelpCenterPage");
const SitemapPage = lazyFooter("SitemapPage");

const App = () => {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const portal = resolvePortal();
    if (portal) {
      const titles = {
        customer: "MultiCommerce — Customer",
        vendor: "MultiCommerce — Vendor",
        admin: "MultiCommerce — Admin",
      };
      document.title = titles[portal] || document.title;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const hasSession =
      Boolean(localStorage.getItem("token")) ||
      Boolean(localStorage.getItem("user"));

    if (!hasSession) {
      setSessionReady(true);
      return undefined;
    }

    bootstrapSession()
      .catch(() => false)
      .finally(() => {
        if (active) setSessionReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!sessionReady) {
    return <PageLoader label="Restoring your session" />;
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <PortalSwitchGuard />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DevPortalHome Home={Home} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/forgot-password"
            element={<ForgotPassword portal="customer" />}
          />
          <Route path="/resetPassword/:token" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route
            path="/admin/forgot-password"
            element={<ForgotPassword portal="admin" />}
          />
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/info/terms" element={<VendorTermsPublic />} />
          <Route
            path="/vendor/forgot-password"
            element={<ForgotPassword portal="vendor" />}
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["superAdmin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="stores" element={<AdminStores />} />
            <Route path="stores/:id" element={<AdminStoreDetail />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="alerts" element={<StockAlerts scope="admin" />} />
            <Route path="sales" element={<AdminSales />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="coupons" element={<CouponsManager role="admin" />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="reviews" element={<ReviewsHub scope="admin" />} />
            <Route
              path="marketing"
              element={<MarketingBanners scope="admin" />}
            />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<ProfilePage roleLabel="Admin" />} />
            <Route
              path="change-password"
              element={
                <ChangePasswordPage
                  roleLabel="Admin"
                  loginPath="/admin/login"
                  logoutEndpoint="/admin/auth/logout"
                />
              }
            />
          </Route>

          <Route
            path="/vendor"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VendorOverview />} />
            <Route path="store" element={<VendorStore />} />
            <Route path="shipping" element={<VendorShipping />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="media" element={<VendorMediaLibrary />} />
            <Route path="product-table" element={<VendorProductTable />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="support" element={<VendorSupport />} />
            <Route path="payments" element={<VendorPayments />} />
            <Route path="payouts" element={<VendorPayouts />} />
            <Route path="reports" element={<VendorReports />} />
            <Route path="terms" element={<VendorTerms />} />
            <Route path="guide" element={<VendorGuide />} />
            <Route path="notifications" element={<VendorNotifications />} />
            <Route path="inventory" element={<VendorInventory />} />
            <Route path="alerts" element={<StockAlerts scope="vendor" />} />
            <Route path="coupons" element={<CouponsManager role="vendor" />} />
            <Route path="reviews" element={<ReviewsHub scope="vendor" />} />
            <Route
              path="marketing"
              element={<MarketingBanners scope="vendor" />}
            />
            <Route path="settings" element={<VendorSettings />} />
            <Route path="profile" element={<ProfilePage roleLabel="Vendor" />} />
            <Route
              path="change-password"
              element={
                <ChangePasswordPage
                  roleLabel="Vendor"
                  loginPath="/vendor/login"
                  logoutEndpoint="/vendor/auth/logout"
                />
              }
            />
          </Route>

          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerHome />} />
            <Route path="products" element={<CustomerProducts />} />
            <Route path="products/:id" element={<CustomerProductDetail />} />
            <Route path="info/about" element={<AboutPage />} />
            <Route path="info/careers" element={<CareersPage />} />
            <Route path="info/press" element={<PressPage />} />
            <Route path="info/contact" element={<ContactPage />} />
            <Route path="info/returns" element={<ReturnPolicyPage />} />
            <Route path="info/terms" element={<TermsPage />} />
            <Route path="info/privacy" element={<PrivacyPage />} />
            <Route path="info/shipping" element={<ShippingPage />} />
            <Route path="info/cancellation" element={<CancellationPage />} />
            <Route path="info/faq" element={<FAQPage />} />
            <Route path="info/payments" element={<PaymentsHelpPage />} />
            <Route path="info/advertise" element={<AdvertisePage />} />
            <Route path="info/download-app" element={<DownloadAppPage />} />
            <Route path="info/gift-cards" element={<GiftCardsInfoPage />} />
            <Route path="info/help-center" element={<HelpCenterPage />} />
            <Route path="info/sitemap" element={<SitemapPage />} />

            <Route element={<ProtectedRoute roles={["customer"]} />}>
              <Route path="stores" element={<CustomerStores />} />
              <Route path="stores/:id" element={<CustomerStoreDetail />} />
              <Route path="cart" element={<CustomerCart />} />
              <Route path="orders" element={<CustomerOrders />} />
              <Route path="payments" element={<CustomerPayments />} />
              <Route
                path="profile"
                element={<Navigate to="/customer/account/profile" replace />}
              />
              <Route path="account" element={<CustomerAccountLayout />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="addresses" element={<AccountAddresses />} />
                <Route path="coupons" element={<AccountCoupons />} />
                <Route path="reviews" element={<AccountReviews />} />
                <Route path="notifications" element={<AccountNotifications />} />
                <Route path="wishlist" element={<AccountWishlist />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
