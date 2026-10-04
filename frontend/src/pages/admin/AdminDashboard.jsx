import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../api/apiInstaince";
import {
  orderApi,
  productApi,
  storeApi,
  unwrapList,
} from "../../api/services";
import { SalesAreaChart } from "../../components/charts/AnalyticsCharts";
import { notify } from "../../utils/notify";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const STUCK_DAYS = 3;

function daysOld(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

const shortNumber = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(value || 0);

function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Operator Home — queues first, KPIs second, charts + demand last.
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailyReport, setDailyReport] = useState([]);
  const [demand, setDemand] = useState(null);
  const [queues, setQueues] = useState({
    inactiveStores: 0,
    lowStock: 0,
    stuckOrders: 0,
    paymentIssues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [dashRes, storesRes, ordersRes, productsRes] = await Promise.all([
          apiInstance.get("/dashboard/stats"),
          storeApi.list(),
          orderApi.listAll(),
          productApi.list({ page: 1, limit: 200 }),
        ]);
        if (!active) return;

        setStats(dashRes.data.stats);
        setDailyReport(dashRes.data.dailyReport || []);
        setDemand(dashRes.data.demand || null);

        const stores = storesRes.data?.data || [];
        const orders = ordersRes.data?.data || [];
        const products = unwrapList(productsRes.data).data;

        const inactiveStores = stores.filter((s) => s.isActive === false).length;
        const lowStock = products.filter((p) => {
          const stock = Number(p.stock ?? p.totalStock ?? 0);
          const threshold = Number(p.lowStockThreshold ?? 5);
          return stock <= threshold;
        }).length;
        const stuckOrders = orders.filter(
          (o) =>
            o.orderStatus === "Pending" && daysOld(o.createdAt) >= STUCK_DAYS
        ).length;
        const paymentIssues = orders.filter((o) =>
          ["Pending", "Failed", "Refunded"].includes(o.paymentStatus)
        ).length;

        setQueues({
          inactiveStores,
          lowStock,
          stuckOrders,
          paymentIssues,
        });
      } catch (err) {
        if (!active) return;
        setError(true);
        notify.fromError(err, "Failed to load home");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const queueCards = useMemo(
    () => [
      {
        label: "Suspended stores",
        count: queues.inactiveStores,
        action: "Review stores",
        to: "/admin/stores?status=inactive",
        icon: "fa-solid fa-store-slash",
        tone: "danger",
        detail: "Stores blocked from selling",
      },
      {
        label: "Low stock SKUs",
        count: queues.lowStock,
        action: "Open alerts",
        to: "/admin/alerts",
        icon: "fa-solid fa-triangle-exclamation",
        tone: "warn",
        detail: "Products at or below threshold",
      },
      {
        label: `Orders stuck (≥ ${STUCK_DAYS}d)`,
        count: queues.stuckOrders,
        action: "Open orders",
        to: "/admin/orders?status=Pending",
        icon: "fa-solid fa-clock",
        tone: "warn",
        detail: "Needs fulfillment attention",
      },
      {
        label: "Payment issues",
        count: queues.paymentIssues,
        action: "Open payments",
        to: "/admin/payments",
        icon: "fa-solid fa-credit-card",
        tone: "danger",
        detail: "Pending, failed, or refunded",
      },
      {
        label: "Reviews",
        count: "—",
        action: "Open reviews",
        to: "/admin/reviews",
        icon: "fa-solid fa-star-half-stroke",
        tone: "neutral",
        detail: "Moderation and quality checks",
      },
    ],
    [queues]
  );

  if (loading) {
    return <p className="muted">Loading control plane…</p>;
  }

  if (error || !stats) {
    return <p className="muted">Unable to load Home. Please refresh.</p>;
  }

  const kpis = [
    {
      label: "Sales today",
      value: formatCurrency(stats.todaySales),
      helper: `${stats.todayOrders || 0} orders today`,
      icon: "fa-solid fa-indian-rupee-sign",
    },
    {
      label: "Orders",
      value: shortNumber(stats.orders),
      helper: `${stats.todayOrders || 0} new today`,
      icon: "fa-solid fa-box",
    },
    {
      label: "Stores",
      value: shortNumber(stats.stores),
      helper: `${queues.inactiveStores} suspended`,
      icon: "fa-solid fa-store",
    },
    {
      label: "Products",
      value: shortNumber(stats.products),
      helper: `${queues.lowStock} low stock`,
      icon: "fa-solid fa-tags",
    },
    {
      label: "Users",
      value: shortNumber(stats.users),
      helper: "Customers, vendors, admins",
      icon: "fa-solid fa-users",
    },
    {
      label: "Stock units",
      value: shortNumber(stats.stock),
      helper: "Across marketplace",
      icon: "fa-solid fa-warehouse",
    },
  ];

  const openIssues =
    Number(queues.inactiveStores) +
    Number(queues.lowStock) +
    Number(queues.stuckOrders) +
    Number(queues.paymentIssues);
  const healthScore = Math.max(0, 100 - openIssues * 8);
  const healthTone =
    healthScore >= 85 ? "good" : healthScore >= 65 ? "warn" : "bad";
  const latestDay = dailyReport[dailyReport.length - 1];
  const previousDay = dailyReport[dailyReport.length - 2];
  const salesDelta =
    latestDay && previousDay
      ? Number(latestDay.sales || 0) - Number(previousDay.sales || 0)
      : 0;

  const demandIcon =
    demand?.greening === "rising"
      ? "fa-arrow-trend-up"
      : demand?.greening === "cooling"
        ? "fa-arrow-trend-down"
        : "fa-minus";

  return (
    <div className="aw-dashboard">
      <section className="aw-hero aw-card">
        <div className="aw-hero-copy">
          <p className="aw-eyebrow">Marketplace control plane</p>
          <h2>{greetingForHour()}, Admin</h2>
          <p>
            Review risk first, then sales, stores, and demand across the
            marketplace.
          </p>
          <div className="aw-hero-actions">
            <Link className="panel-btn" to="/admin/orders">
              Review orders
            </Link>
            <Link className="panel-btn secondary" to="/admin/stores">
              Manage vendors
            </Link>
          </div>
        </div>
        <div className={`aw-health aw-health--${healthTone}`}>
          <span>Platform health</span>
          <strong>{healthScore}</strong>
          <small>
            {openIssues} open signal{openIssues === 1 ? "" : "s"}
          </small>
        </div>
      </section>

      <section className="aw-block">
        <div className="aw-section-head">
          <div>
            <p className="aw-section-label">Needs attention</p>
            <h3>Operator queue</h3>
          </div>
          <Link to="/admin/reports">View reports</Link>
        </div>
        <div className="aw-queue-grid aw-queue-grid--hero">
          {queueCards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className={`aw-queue-card aw-card aw-queue-card--${card.tone}`}
            >
              <div className="aw-queue-card__top">
                <span className="aw-queue-card__icon" aria-hidden="true">
                  <i className={card.icon} />
                </span>
                <p className="aw-queue-card__count">{card.count}</p>
              </div>
              <p className="aw-queue-card__label">{card.label}</p>
              <p className="aw-queue-card__detail">{card.detail}</p>
              <p className="aw-queue-card__action">{card.action} →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="aw-block">
        <div className="aw-section-head">
          <div>
            <p className="aw-section-label">Today</p>
            <h3>Platform pulse</h3>
          </div>
        </div>
        <div className="aw-kpi-strip aw-kpi-strip--dashboard">
          {kpis.map((k) => (
            <div className="aw-kpi-card aw-card" key={k.label}>
              <span className="aw-kpi-card__icon" aria-hidden="true">
                <i className={k.icon} />
              </span>
              <span>{k.label}</span>
              <strong>{k.value}</strong>
              <small>{k.helper}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="aw-dashboard-grid">
        <div className="dashboard-panel aw-chart-panel">
          <div className="aw-panel-head">
            <div>
              <p className="aw-section-label">Trends</p>
              <h3>Sales & orders</h3>
            </div>
            <span
              className={
                salesDelta >= 0
                  ? "status-chip--ok status-chip"
                  : "status-chip--bad status-chip"
              }
            >
              {salesDelta >= 0 ? "+" : ""}
              {formatCurrency(salesDelta)} vs prev day
            </span>
          </div>
          <SalesAreaChart data={dailyReport} height={280} />
        </div>

        <div className="dashboard-panel aw-report-panel">
          <div className="aw-panel-head">
            <div>
              <p className="aw-section-label">Daily report</p>
              <h3>Last 7 days</h3>
            </div>
          </div>
          <table className="daily-table aw-daily-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {dailyReport
                .slice(-7)
                .reverse()
                .map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.orders}</td>
                    <td>{formatCurrency(day.sales)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {demand ? (
        <section className="aw-demand aw-block">
          <div className="aw-section-head">
            <div>
              <p className="aw-section-label">Demand system</p>
              <h3>Marketplace greening & hot sellers</h3>
            </div>
            <Link to="/admin/sales">Open sales</Link>
          </div>

          <div className="aw-demand-summary">
            <div
              className={`aw-demand-badge aw-demand-badge--${demand.greening}`}
            >
              <span className="aw-demand-badge__icon" aria-hidden="true">
                <i className={`fa-solid ${demandIcon}`} />
              </span>
              <div>
                <strong>
                  {demand.greening === "rising"
                    ? "Demand rising"
                    : demand.greening === "cooling"
                      ? "Demand cooling"
                      : "Demand steady"}
                </strong>
                <p>
                  Week-over-week sales {demand.salesGrowthPct >= 0 ? "+" : ""}
                  {demand.salesGrowthPct}% · orders{" "}
                  {demand.ordersGrowthPct >= 0 ? "+" : ""}
                  {demand.ordersGrowthPct}%
                </p>
              </div>
            </div>
            <div className="aw-demand-metric">
              <span>This week sales</span>
              <strong>{formatCurrency(demand.weekSales)}</strong>
              <small>Prev week {formatCurrency(demand.prevWeekSales)}</small>
            </div>
            <div className="aw-demand-metric">
              <span>This week orders</span>
              <strong>{demand.weekOrders || 0}</strong>
              <small>Prev week {demand.prevWeekOrders || 0}</small>
            </div>
          </div>

          <div className="dashboard-panel aw-demand-table-wrap">
            <div className="aw-panel-head">
              <div>
                <p className="aw-section-label">High chance to sell</p>
                <h3>Products to watch</h3>
              </div>
            </div>
            {demand.hotProducts?.length ? (
              <table className="daily-table aw-daily-table aw-demand-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Store</th>
                    <th>Units (14d)</th>
                    <th>Revenue</th>
                    <th>Stock</th>
                    <th>Sale chance</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.hotProducts.map((p) => (
                    <tr key={String(p.productId)}>
                      <td>
                        <div className="aw-product-cell">
                          <span className="aw-product-cell__name">{p.name}</span>
                          {p.trend === "up" || p.trend === "down" ? (
                            <span
                              className={`aw-trend-pill aw-trend-pill--${p.trend}`}
                            >
                              {p.trend === "up" ? "Rising" : "Cooling"}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{p.storeName}</td>
                      <td>{p.unitsSold}</td>
                      <td>{formatCurrency(p.revenue)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <div className="aw-chance">
                          <span className="aw-chance-track">
                            <span
                              className="aw-chance-bar"
                              style={{
                                width: `${Math.max(8, p.chance)}%`,
                                background:
                                  p.chance >= 70
                                    ? "#0f6b4c"
                                    : p.chance >= 45
                                      ? "#b54708"
                                      : "#64748b",
                              }}
                            />
                          </span>
                          <em>{p.chance}%</em>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ margin: "12px 0 0" }}>
                Not enough paid orders yet to rank product demand.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
