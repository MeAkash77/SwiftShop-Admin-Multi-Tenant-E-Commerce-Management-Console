/**
 * Vendor workspace shell — Shopify-plain admin nav + theme.
 * Plan: docs/vendor/UI-UX-SHOPIFY-PLAIN.md
 */
import PanelLayout from "./PanelLayout";
import usePanelTheme from "../hooks/usePanelTheme";
import NotificationBell from "../components/notifications/NotificationBell";
import "./VendorWorkspace.css";

const vendorMenu = [
  { to: "/vendor", label: "Home", icon: "fa-solid fa-house", end: true },
  { to: "/vendor/notifications", label: "Notifications", icon: "fa-solid fa-bell" },
  { to: "/vendor/orders", label: "Orders", icon: "fa-solid fa-box" },
  {
    type: "group",
    id: "products",
    label: "Products",
    icon: "fa-solid fa-tags",
    children: [
      {
        to: "/vendor/product-table",
        label: "All products",
        icon: "fa-solid fa-table",
      },
      { to: "/vendor/products", label: "Add product", icon: "fa-solid fa-plus" },
      { to: "/vendor/media", label: "Media", icon: "fa-solid fa-images" },
      { to: "/vendor/inventory", label: "Inventory", icon: "fa-solid fa-clipboard-list" },
      {
        to: "/vendor/alerts",
        label: "Low stock",
        icon: "fa-solid fa-triangle-exclamation",
      },
    ],
  },
  { to: "/vendor/coupons", label: "Discounts", icon: "fa-solid fa-ticket" },
  {
    type: "group",
    id: "store",
    label: "Store",
    icon: "fa-solid fa-store",
    children: [
      { to: "/vendor/store", label: "Store details", icon: "fa-solid fa-shop" },
      { to: "/vendor/shipping", label: "Shipping", icon: "fa-solid fa-truck" },
    ],
  },
  { to: "/vendor/marketing", label: "Marketing", icon: "fa-solid fa-images" },
  { to: "/vendor/support", label: "Inbox", icon: "fa-solid fa-inbox" },
  { to: "/vendor/reviews", label: "Reviews", icon: "fa-solid fa-star" },
  { to: "/vendor/payments", label: "Payments", icon: "fa-solid fa-credit-card" },
  { to: "/vendor/payouts", label: "Payouts", icon: "fa-solid fa-money-bill-transfer" },
  { to: "/vendor/reports", label: "Reports", icon: "fa-solid fa-file-lines" },
  { to: "/vendor/guide", label: "Getting started", icon: "fa-solid fa-compass" },
  { to: "/vendor/terms", label: "Seller terms", icon: "fa-solid fa-file-contract" },
  {
    type: "group",
    id: "settings",
    label: "Settings",
    icon: "fa-solid fa-gear",
    children: [
      { to: "/vendor/settings", label: "Appearance", icon: "fa-solid fa-sliders" },
      { to: "/vendor/profile", label: "Profile", icon: "fa-solid fa-id-card" },
      {
        to: "/vendor/change-password",
        label: "Password",
        icon: "fa-solid fa-key",
      },
    ],
  },
];

const VendorLayout = () => {
  const { theme, setTheme, toggleTheme } = usePanelTheme(
    "vendor-panel-theme",
    "light",
    { applyToDocument: true }
  );

  return (
    <PanelLayout
      brandTitle="MultiCommerce"
      brandSubtitle="Admin"
      brandIcon="fa-solid fa-store"
      menuItems={vendorMenu}
      homePath="/vendor"
      logoutPath="/vendor/login"
      logoutEndpoint="/vendor/auth/logout"
      theme={theme}
      onThemeToggle={toggleTheme}
      settingsPath="/vendor/settings"
      shellClassName="vendor-workspace"
      topbarLeadingActions={<NotificationBell listPath="/vendor/notifications" />}
      outletContext={{ theme, setTheme, toggleTheme }}
    />
  );
};

export default VendorLayout;
