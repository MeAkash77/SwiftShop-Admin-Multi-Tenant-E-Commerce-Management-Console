import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { orderApi, productApi, storeApi } from "../../api/services";
import {
  OrdersBarChart,
  SalesAreaChart,
} from "../../components/charts/AnalyticsCharts";
import VendorOnboardingTour from "../../components/vendor/VendorOnboardingTour";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const LOW_STOCK = 10;

const VendorOverview = () => {
  const user = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    stock: 0,
    revenue: 0,
    store: null,
    ordersList: [],
    productsList: [],
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [storeRes, productsRes] = await Promise.all([
          storeApi.getByVendor(user.id).catch(() => null),
          productApi.vendorList(),
        ]);

        const store = storeRes?.data?.data || null;
        const products = productsRes.data || [];
        let orders = [];

        if (store?._id) {
          const ordersRes = await orderApi.byStore(store._id);
          orders = ordersRes.data?.data || ordersRes.data || [];
        }

        const paid = orders.filter((o) => o.paymentStatus === "Paid");

        setStats({
          store,
          products: products.length,
          orders: Array.isArray(orders) ? orders.length : 0,
          stock: products.reduce((sum, item) => sum + (item.stock || 0), 0),
          revenue: paid.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          ordersList: Array.isArray(orders) ? orders : [],
          productsList: Array.isArray(products) ? products : [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) load();
  }, [user?.id]);

  const daily = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key, orders: 0, sales: 0 };
    }
    for (const order of stats.ordersList) {
      const key = order.createdAt
        ? new Date(order.createdAt).toISOString().slice(0, 10)
        : null;
      if (!key || !map[key]) continue;
      map[key].orders += 1;
      if (order.paymentStatus === "Paid") {
        map[key].sales += order.totalAmount || 0;
      }
    }
    return Object.values(map);
  }, [stats.ordersList]);

  const statusBars = useMemo(() => {
    const counts = {};
    for (const order of stats.ordersList) {
      const status = order.orderStatus || "Pending";
      counts[status] = (counts[status] || 0) + 1;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }, [stats.ordersList]);

  const needsFulfill = useMemo(
    () =>
      stats.ordersList.filter((o) =>
        ["Pending", "Confirmed", "Processing"].includes(o.orderStatus || "Pending")
      ).length,
    [stats.ordersList]
  );

  const lowStockCount = useMemo(
    () =>
      stats.productsList.filter((p) => {
        const stock = Number(p.stock ?? 0);
        const variantLow = (p.variants || []).some(
          (v) => Number(v.stock ?? 0) <= LOW_STOCK
        );
        return stock <= LOW_STOCK || variantLow;
      }).length,
    [stats.productsList]
  );

  const setupSteps = useMemo(() => {
    const hasStore = Boolean(stats.store?._id);
    const hasShipping =
      hasStore &&
      (stats.store.shippingFee != null || stats.store.estimatedDeliveryDays != null);
    const hasProduct = stats.products > 0;
    return [
      {
        done: hasStore,
        label: "Create store",
        to: "/vendor/store",
      },
      {
        done: hasShipping,
        label: "Set shipping",
        to: "/vendor/shipping",
      },
      {
        done: hasProduct,
        label: "Add a product",
        to: "/vendor/products",
      },
    ];
  }, [stats.store, stats.products]);

  const setupIncomplete = setupSteps.some((s) => !s.done);

  const tasks = useMemo(() => {
    const list = [];
    if (!loading && setupIncomplete) {
      const next = setupSteps.find((s) => !s.done);
      if (next) {
        list.push({
          key: "setup",
          count: setupSteps.filter((s) => !s.done).length,
          label: `Finish setup · ${next.label}`,
          to: next.to,
        });
      }
    }
    if (needsFulfill > 0) {
      list.push({
        key: "orders",
        count: needsFulfill,
        label: needsFulfill === 1 ? "order to fulfill" : "orders to fulfill",
        to: "/vendor/orders",
      });
    }
    if (lowStockCount > 0) {
      list.push({
        key: "stock",
        count: lowStockCount,
        label: lowStockCount === 1 ? "low-stock item" : "low-stock items",
        to: "/vendor/alerts",
      });
    }
    return list;
  }, [loading, setupIncomplete, setupSteps, needsFulfill, lowStockCount]);

  return (
    <div className="stack-gap">
      <VendorOnboardingTour />
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Home</h2>
            <p className="page-subtitle">
              {stats.store?.storeName
                ? `Store: ${stats.store.storeName}`
                : "Here’s what needs your attention"}
            </p>
          </div>
          <div className="vendor-hero-actions">
            <Link className="panel-btn secondary" to="/vendor/guide">
              Getting started
            </Link>
            <Link className="panel-btn" to="/vendor/products">
              Add product
            </Link>
            <Link className="panel-btn secondary" to="/vendor/orders">
              Orders
            </Link>
          </div>
        </div>
      </section>

      <section className="form-card vendor-home-tasks">
        <h3 className="vendor-section-title">Needs attention</h3>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : tasks.length ? (
          <ul className="vendor-task-list">
            {tasks.map((t) => (
              <li key={t.key}>
                <Link to={t.to} className="vendor-task-link">
                  <span className="vendor-task-count">{t.count}</span>
                  <span>{t.label}</span>
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            You’re all caught up. No open fulfillments or low stock.
          </p>
        )}

        {setupIncomplete && !loading ? (
          <ol className="vendor-setup-list">
            {setupSteps.map((step) => (
              <li key={step.label} className={step.done ? "is-done" : ""}>
                <i
                  className={`fa-solid ${step.done ? "fa-circle-check" : "fa-circle"}`}
                  aria-hidden="true"
                />
                {step.done ? (
                  <span>{step.label}</span>
                ) : (
                  <Link to={step.to}>{step.label}</Link>
                )}
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <div className="vendor-stat-grid vendor-stat-grid--plain">
        <div className="vendor-stat">
          <p className="muted">Products</p>
          <strong>{loading ? "…" : stats.products}</strong>
          <Link to="/vendor/product-table" className="vendor-stat-link">
            All products
          </Link>
        </div>
        <div className="vendor-stat">
          <p className="muted">Orders</p>
          <strong>{loading ? "…" : stats.orders}</strong>
          <Link to="/vendor/orders" className="vendor-stat-link">
            View orders
          </Link>
        </div>
        <div className="vendor-stat">
          <p className="muted">Stock units</p>
          <strong>{loading ? "…" : stats.stock}</strong>
          <Link to="/vendor/inventory" className="vendor-stat-link">
            Inventory
          </Link>
        </div>
        <div className="vendor-stat">
          <p className="muted">Paid revenue</p>
          <strong>{loading ? "…" : formatCurrency(stats.revenue)}</strong>
          <Link to="/vendor/payments" className="vendor-stat-link">
            Payments
          </Link>
        </div>
      </div>

      <div className="vendor-charts">
        <section className="dashboard-panel">
          <h3>Last 7 days</h3>
          <SalesAreaChart data={daily} />
        </section>
        <section className="dashboard-panel">
          <h3>Orders by status</h3>
          <OrdersBarChart data={statusBars} />
        </section>
      </div>
    </div>
  );
};

export default VendorOverview;
