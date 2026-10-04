import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../api/apiInstaince";
import {
  orderApi,
  productApi,
  storeApi,
  userApi,
  unwrapList,
} from "../../api/services";
import DailyReportsManager from "../../components/reports/DailyReportsManager";
import { notify } from "../../utils/notify";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const shortNumber = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(value || 0);

/**
 * Insights → Reports — platform KPIs + historical daily reports / CSV downloads.
 */
const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState({
    vendors: 0,
    customers: 0,
    stores: 0,
    lowStock: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [dashRes, usersRes, productsRes, storesRes, ordersRes] =
          await Promise.all([
            apiInstance.get("/dashboard/stats"),
            userApi.list({}),
            productApi.list({ page: 1, limit: 200 }),
            storeApi.list(),
            orderApi.listAll(),
          ]);
        if (!active) return;

        const users = usersRes.data?.data || [];
        const products = unwrapList(productsRes.data).data;
        setStats(dashRes.data.stats);
        setSummary({
          vendors: users.filter((u) => u.role === "vendor").length,
          customers: users.filter((u) => u.role === "customer").length,
          lowStock: products.filter((p) => {
            const stock = Number(p.stock ?? p.totalStock ?? 0);
            const threshold = Number(p.lowStockThreshold ?? 5);
            return stock <= threshold;
          }).length,
          stores: storesRes.data?.data?.length || 0,
          orders: ordersRes.data?.data?.length || 0,
        });
      } catch (err) {
        if (!active) return;
        setError(true);
        notify.fromError(err, "Failed to load reports.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="muted">Loading reports…</p>;
  }

  if (error || !stats) {
    return <p className="muted">Unable to load Reports. Please refresh.</p>;
  }

  const kpis = [
    {
      label: "Vendors",
      value: shortNumber(summary.vendors),
      helper: "Seller accounts",
      icon: "fa-solid fa-store",
      to: "/admin/stores",
    },
    {
      label: "Customers",
      value: shortNumber(summary.customers),
      helper: "Buyer accounts",
      icon: "fa-solid fa-users",
      to: "/admin/customers",
    },
    {
      label: "Stores",
      value: shortNumber(summary.stores),
      helper: "Live storefronts",
      icon: "fa-solid fa-shop",
      to: "/admin/stores",
    },
    {
      label: "Low stock SKUs",
      value: shortNumber(summary.lowStock),
      helper: "At or below threshold",
      icon: "fa-solid fa-triangle-exclamation",
      to: "/admin/alerts",
      tone: summary.lowStock > 0 ? "warn" : undefined,
    },
    {
      label: "Total sales",
      value: formatCurrency(stats.sales),
      helper: `${shortNumber(summary.orders)} orders all-time`,
      icon: "fa-solid fa-indian-rupee-sign",
      to: "/admin/sales",
    },
    {
      label: "Today sales",
      value: formatCurrency(stats.todaySales),
      helper: `${stats.todayOrders || 0} orders today`,
      icon: "fa-solid fa-calendar-day",
      to: "/admin/orders",
    },
  ];

  return (
    <div className="aw-dashboard aw-reports">
      <section className="aw-hero aw-card">
        <div className="aw-hero-copy">
          <p className="aw-eyebrow">Insights</p>
          <h2>Reports</h2>
          <p>
            Platform snapshot plus historical daily reports. Load older ranges
            and download day or order-level CSVs.
          </p>
          <div className="aw-hero-actions">
            <Link className="panel-btn" to="/admin/sales">
              Open sales
            </Link>
            <Link className="panel-btn secondary" to="/admin/orders">
              Review orders
            </Link>
          </div>
        </div>
        <div className="aw-health aw-health--good aw-reports-week">
          <span>Today sales</span>
          <strong className="aw-reports-week__value">
            {formatCurrency(stats.todaySales)}
          </strong>
          <small>
            {stats.todayOrders || 0} order
            {(stats.todayOrders || 0) === 1 ? "" : "s"} today
          </small>
        </div>
      </section>

      <section className="aw-block">
        <div className="aw-section-head">
          <div>
            <p className="aw-section-label">Platform</p>
            <h3>Key metrics</h3>
          </div>
        </div>
        <div className="aw-kpi-strip aw-kpi-strip--dashboard">
          {kpis.map((k) => {
            const inner = (
              <>
                <span className="aw-kpi-card__icon" aria-hidden="true">
                  <i className={k.icon} />
                </span>
                <span>{k.label}</span>
                <strong>{k.value}</strong>
                <small>{k.helper}</small>
              </>
            );
            return k.to ? (
              <Link
                key={k.label}
                to={k.to}
                className={`aw-kpi-card aw-card aw-kpi-card--link${
                  k.tone === "warn" ? " aw-kpi-card--warn" : ""
                }`}
              >
                {inner}
              </Link>
            ) : (
              <div className="aw-kpi-card aw-card" key={k.label}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <DailyReportsManager
        title="Marketplace daily reports"
        subtitle="Browse 7 / 30 / 90 days or pick a custom range for older reports. Download day totals or full order lists."
      />
    </div>
  );
};

export default AdminReports;
