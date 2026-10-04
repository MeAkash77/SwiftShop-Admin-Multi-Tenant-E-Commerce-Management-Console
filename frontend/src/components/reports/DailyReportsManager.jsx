import { useCallback, useEffect, useMemo, useState } from "react";
import { reportApi } from "../../api/services";
import { SalesAreaChart } from "../charts/AnalyticsCharts";
import { downloadCsv } from "../../utils/csv";
import { notify } from "../../utils/notify";
import "./DailyReportsManager.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDayLabel = (isoDate) => {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const PRESETS = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
];

function defaultRange(days = 7) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

/**
 * Shared historical daily reports: range presets, old reports, chart + CSV downloads.
 * Used by admin and vendor report pages.
 */
export default function DailyReportsManager({
  title = "Daily reports",
  subtitle = "Browse older periods and download daily CSVs.",
}) {
  const [preset, setPreset] = useState("7");
  const [from, setFrom] = useState(() => defaultRange(7).from);
  const [to, setTo] = useState(() => defaultRange(7).to);
  const [dailyReport, setDailyReport] = useState([]);
  const [rangeMeta, setRangeMeta] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [downloadingDay, setDownloadingDay] = useState(null);

  const loadRange = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await reportApi.daily(params);
      setDailyReport(res.data?.dailyReport || []);
      setRangeMeta({
        from: res.data?.from || params.from || "",
        to: res.data?.to || params.to || "",
      });
    } catch (err) {
      notify.fromError(err, "Failed to load daily report.");
      setDailyReport([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRange({ days: 7 });
  }, [loadRange]);

  const applyPreset = (p) => {
    setPreset(p.id);
    const range = defaultRange(p.days);
    setFrom(range.from);
    setTo(range.to);
    loadRange({ days: p.days });
  };

  const applyCustom = (e) => {
    e.preventDefault();
    if (!from || !to) {
      notify.error("Choose both from and to dates.");
      return;
    }
    if (from > to) {
      notify.error("From date must be on or before to date.");
      return;
    }
    setPreset("custom");
    loadRange({ from, to });
  };

  const totals = useMemo(() => {
    const sales = dailyReport.reduce((s, d) => s + Number(d.sales || 0), 0);
    const orders = dailyReport.reduce((s, d) => s + Number(d.orders || 0), 0);
    const maxSales = Math.max(
      ...dailyReport.map((d) => Number(d.sales || 0)),
      1
    );
    const best = dailyReport.reduce(
      (acc, d) => (Number(d.sales || 0) > Number(acc.sales || 0) ? d : acc),
      dailyReport[0] || { date: "—", sales: 0, orders: 0 }
    );
    return { sales, orders, maxSales, best };
  }, [dailyReport]);

  const exportRange = () => {
    if (!dailyReport.length) {
      notify.error("No rows to export.");
      return;
    }
    downloadCsv(
      `daily-report-${rangeMeta.from || from}_to_${rangeMeta.to || to}.csv`,
      [
        ["Date", "Orders", "Sales (INR)"],
        ...dailyReport.map((d) => [d.date, d.orders, d.sales]),
        [],
        ["Total orders", totals.orders, ""],
        ["Total sales (INR)", "", totals.sales],
      ]
    );
  };

  const exportDaySummary = (day) => {
    downloadCsv(`daily-report-${day.date}.csv`, [
      ["Date", "Orders", "Sales (INR)"],
      [day.date, day.orders, day.sales],
    ]);
  };

  const exportDayDetail = async (day) => {
    setDownloadingDay(day.date);
    try {
      const res = await reportApi.dayDetail(day.date);
      const orders = res.data?.orders || [];
      const summary = res.data?.summary || day;
      downloadCsv(`daily-orders-${day.date}.csv`, [
        ["Date", day.date],
        ["Orders", summary.orders ?? day.orders],
        ["Paid sales (INR)", summary.sales ?? day.sales],
        [],
        [
          "Order number",
          "Created at",
          "Customer",
          "Email",
          "Payment",
          "Status",
          "Amount (INR)",
        ],
        ...orders.map((o) => [
          o.orderNumber,
          o.createdAt ? new Date(o.createdAt).toISOString() : "",
          o.customerName,
          o.customerEmail,
          o.paymentStatus,
          o.orderStatus,
          o.totalAmount,
        ]),
      ]);
    } catch (err) {
      notify.fromError(err, "Failed to download day report.");
    } finally {
      setDownloadingDay(null);
    }
  };

  return (
    <section className="drm">
      <div className="drm-head">
        <div>
          <p className="drm-label">History</p>
          <h3>{title}</h3>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            {subtitle}
          </p>
        </div>
        <button type="button" className="panel-btn secondary" onClick={exportRange}>
          Export range CSV
        </button>
      </div>

      <div className="drm-toolbar">
        <div className="drm-presets" role="group" aria-label="Report range">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`panel-btn secondary${
                preset === item.id ? " is-active" : ""
              }`}
              onClick={() => applyPreset(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form className="drm-custom" onSubmit={applyCustom}>
          <label>
            <span>From</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button type="submit" className="panel-btn">
            Load old report
          </button>
        </form>
      </div>

      <div className="drm-strip">
        <div className="drm-metric">
          <span>Period sales</span>
          <strong>{formatCurrency(totals.sales)}</strong>
          <small>
            {rangeMeta.from && rangeMeta.to
              ? `${rangeMeta.from} → ${rangeMeta.to}`
              : "Selected range"}
          </small>
        </div>
        <div className="drm-metric">
          <span>Period orders</span>
          <strong>{totals.orders}</strong>
          <small>{dailyReport.length} days in view</small>
        </div>
        <div className="drm-metric">
          <span>Best day</span>
          <strong>
            {totals.best?.date ? formatDayLabel(totals.best.date) : "—"}
          </strong>
          <small>
            {formatCurrency(totals.best?.sales)} · {totals.best?.orders || 0}{" "}
            orders
          </small>
        </div>
      </div>

      <div className="drm-grid">
        <div className="dashboard-panel drm-panel">
          <div className="drm-panel-head">
            <div>
              <p className="drm-label">Trends</p>
              <h3>Sales & orders</h3>
            </div>
          </div>
          {loading ? (
            <p className="muted">Loading chart…</p>
          ) : (
            <SalesAreaChart
              data={dailyReport}
              height={dailyReport.length > 14 ? 320 : 280}
            />
          )}
        </div>

        <div className="dashboard-panel drm-panel">
          <div className="drm-panel-head">
            <div>
              <p className="drm-label">Daily report</p>
              <h3>Download by day</h3>
            </div>
          </div>
          {loading ? (
            <p className="muted">Loading table…</p>
          ) : dailyReport.length ? (
            <div className="drm-table-wrap">
              <table className="daily-table drm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Sales</th>
                    <th>Share</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dailyReport].reverse().map((day) => {
                    const sales = Number(day.sales || 0);
                    const orders = Number(day.orders || 0);
                    const share = Math.round((sales / totals.maxSales) * 100);
                    const quiet = orders === 0 && sales === 0;
                    const unpaidGap = orders > 0 && sales === 0;
                    return (
                      <tr
                        key={day.date}
                        className={quiet ? "drm-row--quiet" : undefined}
                      >
                        <td>
                          <div className="drm-product-cell">
                            <span className="drm-product-cell__name">
                              {formatDayLabel(day.date)}
                            </span>
                            {unpaidGap ? (
                              <span className="drm-pill">Unpaid</span>
                            ) : null}
                          </div>
                          <span className="drm-date-iso">{day.date}</span>
                        </td>
                        <td>{orders}</td>
                        <td>{formatCurrency(sales)}</td>
                        <td>
                          <div className="drm-chance">
                            <span className="drm-chance-track">
                              <span
                                className="drm-chance-bar"
                                style={{
                                  width: `${quiet ? 0 : Math.max(8, share)}%`,
                                  background: quiet
                                    ? "transparent"
                                    : share >= 70
                                      ? "#0f6b4c"
                                      : share >= 40
                                        ? "#2563eb"
                                        : "#64748b",
                                }}
                              />
                            </span>
                            <em>{quiet ? "—" : `${share}%`}</em>
                          </div>
                        </td>
                        <td>
                          <div className="drm-day-actions">
                            <button
                              type="button"
                              className="panel-btn secondary"
                              onClick={() => exportDaySummary(day)}
                              title="Download day totals CSV"
                            >
                              Day
                            </button>
                            <button
                              type="button"
                              className="panel-btn secondary"
                              disabled={downloadingDay === day.date}
                              onClick={() => exportDayDetail(day)}
                              title="Download orders for this day"
                            >
                              {downloadingDay === day.date ? "…" : "Orders"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No activity in this range.</p>
          )}
        </div>
      </div>
    </section>
  );
}
