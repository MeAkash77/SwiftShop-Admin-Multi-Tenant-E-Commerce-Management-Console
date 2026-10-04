/**
 * Admin Control Plane shell — Marketplace operator console.
 * Plan: docs/admin/UI-UX-PLANNING.md
 */
import PanelLayout from "./PanelLayout";
import usePanelTheme from "../hooks/usePanelTheme";
import AdminGlobalSearch from "../components/admin/AdminGlobalSearch";
import NotificationBell from "../components/notifications/NotificationBell";
import "./AdminWorkspace.css";

const adminMenu = [
  { to: "/admin/dashboard", label: "Home", icon: "fa-solid fa-house", end: true },
  { to: "/admin/notifications", label: "Notifications", icon: "fa-solid fa-bell" },
  {
    type: "group",
    id: "people",
    label: "People",
    icon: "fa-solid fa-users",
    children: [
      {
        to: "/admin/customers",
        label: "Customers",
        icon: "fa-solid fa-user",
        activeSearch: { role: null },
      },
      {
        to: "/admin/customers?role=vendor",
        label: "Vendors",
        icon: "fa-solid fa-user-tie",
      },
      { to: "/admin/users", label: "All users", icon: "fa-solid fa-user-gear" },
    ],
  },
  {
    type: "group",
    id: "vendors",
    label: "Vendors",
    icon: "fa-solid fa-store",
    children: [
      { to: "/admin/stores", label: "Stores", icon: "fa-solid fa-shop" },
      {
        to: "/admin/stores?status=inactive",
        label: "Approvals / suspended",
        icon: "fa-solid fa-clipboard-check",
      },
    ],
  },
  {
    type: "group",
    id: "catalog",
    label: "Catalog",
    icon: "fa-solid fa-boxes-stacked",
    children: [
      { to: "/admin/products", label: "Products", icon: "fa-solid fa-tags" },
      { to: "/admin/catalog", label: "Master catalog", icon: "fa-solid fa-boxes-stacked" },
      { to: "/admin/categories", label: "Categories", icon: "fa-solid fa-folder" },
      { to: "/admin/inventory", label: "Inventory", icon: "fa-solid fa-clipboard-list" },
      {
        to: "/admin/alerts",
        label: "Stock alerts",
        icon: "fa-solid fa-triangle-exclamation",
      },
    ],
  },
  {
    type: "group",
    id: "commerce",
    label: "Commerce",
    icon: "fa-solid fa-bag-shopping",
    children: [
      { to: "/admin/orders", label: "Orders", icon: "fa-solid fa-box" },
      { to: "/admin/payments", label: "Payments", icon: "fa-solid fa-credit-card" },
      { to: "/admin/payouts", label: "Payouts", icon: "fa-solid fa-money-bill-transfer" },
      { to: "/admin/sales", label: "Sales", icon: "fa-solid fa-indian-rupee-sign" },
      { to: "/admin/coupons", label: "Coupons", icon: "fa-solid fa-ticket" },
    ],
  },
  {
    type: "group",
    id: "trust",
    label: "Trust",
    icon: "fa-solid fa-shield-halved",
    children: [
      { to: "/admin/reviews", label: "Reviews", icon: "fa-solid fa-star" },
    ],
  },
  {
    type: "group",
    id: "content",
    label: "Content",
    icon: "fa-solid fa-images",
    children: [
      { to: "/admin/marketing", label: "Home marketing", icon: "fa-solid fa-panorama" },
    ],
  },
  {
    type: "group",
    id: "insights",
    label: "Insights",
    icon: "fa-solid fa-chart-line",
    children: [
      { to: "/admin/reports", label: "Reports", icon: "fa-solid fa-file-lines" },
    ],
  },
  {
    type: "group",
    id: "settings",
    label: "Settings",
    icon: "fa-solid fa-gear",
    children: [
      { to: "/admin/settings", label: "Admins", icon: "fa-solid fa-user-shield" },
      { to: "/admin/profile", label: "Profile", icon: "fa-solid fa-id-card" },
      {
        to: "/admin/change-password",
        label: "Password",
        icon: "fa-solid fa-key",
      },
    ],
  },
];

const AdminLayout = () => {
  const { theme, setTheme, toggleTheme } = usePanelTheme(
    "admin-panel-theme",
    "light",
    { applyToDocument: true }
  );

  return (
    <PanelLayout
      brandTitle="MultiCommerce"
      brandSubtitle="Control Plane"
      brandIcon="fa-solid fa-shield-halved"
      menuItems={adminMenu}
      homePath="/admin/dashboard"
      homeLabel="Home"
      logoutPath="/admin/login"
      logoutEndpoint="/admin/auth/logout"
      theme={theme}
      onThemeToggle={toggleTheme}
      settingsPath="/admin/settings"
      shellClassName="admin-workspace"
      topbarCenter={<AdminGlobalSearch />}
      topbarLeadingActions={<NotificationBell listPath="/admin/notifications" />}
      outletContext={{ theme, setTheme, toggleTheme }}
    />
  );
};

export default AdminLayout;
