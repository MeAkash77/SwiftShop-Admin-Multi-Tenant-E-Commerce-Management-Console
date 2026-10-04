import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { orderApi, productApi, storeApi } from "../../api/services";
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

const LOW_STOCK = 10;

/**
 * Vendor store reports — historical daily sales + CSV downloads.
 */
const VendorReports = () => {
  const user = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    lowStock: 0,
    store: null,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [storeRes, productsRes] = await Promise.all([
          storeApi.getByVendor(user.id).catch(() => null),
          productApi.vendorList(),
        ]);
        if (!active) return;

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
          orders: orders.length,
          revenue: paid.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
          lowStock: products.filter((p) => Number(p.stock ?? 0) <= LOW_STOCK)
            .length,
        });
      } catch (err) {
        if (!active) return;
        notify.fromError(err, "Failed to load store reports.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (user?.id) load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const kpis = useMemo(
    () => [
      {
        label: "Products",
        value: shortNumber(stats.products),
        helper: "In your catalog",
      },
      {
        label: "Orders",
        value: shortNumber(stats.orders),
        helper: "All-time store orders",
      },
      {
        label: "Paid revenue",
        value: formatCurrency(stats.revenue),
        helper: "Collected sales",
      },
      {
        label: "Low stock",
        value: shortNumber(stats.lowStock),
        helper: "Needs restock",
      },
    ],
    [stats]
  );

  if (loading) {
    return <p className="muted">Loading reports…</p>;
  }

  return (
    <div className="vw-reports stack-gap">
      <div className="vw-reports-hero">
        <div>
          <p className="muted" style={{ margin: 0 }}>
            Analytics
          </p>
          <h2 className="page-title" style={{ marginBottom: 4 }}>
            Reports
          </h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {stats.store?.storeName
              ? `Daily sales history for ${stats.store.storeName}. Load older ranges and download CSVs.`
              : "Daily sales history for your store. Load older ranges and download CSVs."}
          </p>
        </div>
        <div className="vw-reports-hero__actions">
          <Link className="panel-btn" to="/vendor/orders">
            Open orders
          </Link>
          <Link className="panel-btn secondary" to="/vendor/payouts">
            Payouts
          </Link>
        </div>
      </div>

      <div className="card-grid">
        {kpis.map((k) => (
          <div className="entity-card" key={k.label}>
            <p className="muted">{k.label}</p>
            <h3>{k.value}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {k.helper}
            </p>
          </div>
        ))}
      </div>

      <DailyReportsManager
        title="Store daily reports"
        subtitle="Browse 7 / 30 / 90 days or a custom date range. Download day totals or the order list for any day."
      />
    </div>
  );
};

export default VendorReports;
