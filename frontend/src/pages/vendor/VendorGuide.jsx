import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../layouts/PanelLayout.css";

const GUIDE_KEY = "mc-vendor-guide-done-v1";
const TOUR_DISMISS_KEY = "mc-vendor-tour-dismissed-v1";

const STEPS = [
  {
    id: "store",
    title: "Create your store",
    body: "Add store name, email, phone, and address. You cannot sell until a store exists.",
    to: "/vendor/store",
    cta: "Open store details",
    icon: "fa-solid fa-shop",
  },
  {
    id: "shipping",
    title: "Set shipping",
    body: "Configure shipping fee and delivery estimate so checkout totals are clear for customers.",
    to: "/vendor/shipping",
    cta: "Open shipping",
    icon: "fa-solid fa-truck",
  },
  {
    id: "product",
    title: "Add your first product",
    body: "Use Add product for a guided form, or All products for bulk import with the CSV/Excel template.",
    to: "/vendor/products",
    cta: "Add product",
    icon: "fa-solid fa-plus",
  },
  {
    id: "orders",
    title: "Fulfill orders",
    body: "Move statuses Pending → Confirmed → Processing → Shipped → Delivered. Keep customers updated.",
    to: "/vendor/orders",
    cta: "View orders",
    icon: "fa-solid fa-box",
  },
  {
    id: "payouts",
    title: "Get paid",
    body: "Weekly bank settlement (BS) can run automatically. You can also withdraw available balance anytime.",
    to: "/vendor/payouts",
    cta: "Open payouts",
    icon: "fa-solid fa-money-bill-transfer",
  },
  {
    id: "terms",
    title: "Read seller terms",
    body: "Review payout rules, weekly BS, and withdrawal policy before you scale inventory.",
    to: "/vendor/terms",
    cta: "Read terms",
    icon: "fa-solid fa-file-contract",
  },
];

/**
 * Interactive first-time seller guide (app-style walkthrough + always-available manual).
 */
const VendorGuide = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [doneIds, setDoneIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GUIDE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const step = STEPS[stepIndex];
  const progress = useMemo(
    () => Math.round((doneIds.length / STEPS.length) * 100),
    [doneIds.length]
  );

  useEffect(() => {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(doneIds));
  }, [doneIds]);

  function markDone(id) {
    setDoneIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function markAllDone() {
    setDoneIds(STEPS.map((s) => s.id));
    localStorage.setItem(TOUR_DISMISS_KEY, "1");
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Getting started</h2>
            <p className="page-subtitle">
              First-time seller walkthrough — same idea as modern apps: clear steps,
              then a permanent help manual.
            </p>
          </div>
          <div className="vendor-hero-actions">
            <button type="button" className="panel-btn secondary" onClick={markAllDone}>
              Mark guide complete
            </button>
            <Link className="panel-btn" to="/vendor">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <div className="form-card vendor-guide-progress">
        <div className="vendor-guide-progress-head">
          <strong>Setup progress</strong>
          <span>{progress}%</span>
        </div>
        <div className="vendor-guide-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="muted" style={{ margin: "0.65rem 0 0" }}>
          {doneIds.length} of {STEPS.length} steps marked done on this device.
        </p>
      </div>

      <div className="vendor-guide-layout">
        <aside className="form-card vendor-guide-steps">
          <h3 className="vendor-section-title">Walkthrough</h3>
          <ol className="vendor-guide-step-list">
            {STEPS.map((item, index) => {
              const done = doneIds.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`vendor-guide-step-btn${
                      index === stepIndex ? " is-active" : ""
                    }${done ? " is-done" : ""}`}
                    onClick={() => setStepIndex(index)}
                  >
                    <i
                      className={`fa-solid ${done ? "fa-circle-check" : "fa-circle"}`}
                      aria-hidden="true"
                    />
                    <span>
                      {index + 1}. {item.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="form-card vendor-guide-detail">
          <span className="vendor-guide-icon" aria-hidden="true">
            <i className={step.icon} />
          </span>
          <p className="muted" style={{ margin: "0 0 0.35rem" }}>
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <h3 style={{ marginTop: 0 }}>{step.title}</h3>
          <p>{step.body}</p>
          <div className="vendor-guide-actions">
            <Link className="panel-btn" to={step.to} onClick={() => markDone(step.id)}>
              {step.cta}
            </Link>
            <button
              type="button"
              className="panel-btn secondary"
              onClick={() => markDone(step.id)}
            >
              Mark done
            </button>
            <button
              type="button"
              className="panel-btn secondary"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="panel-btn secondary"
              disabled={stepIndex >= STEPS.length - 1}
              onClick={() => {
                markDone(step.id);
                setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
              }}
            >
              Next
            </button>
          </div>
        </section>
      </div>

      <article className="form-card">
        <h3 className="vendor-section-title">Quick user manual</h3>
        <div className="vendor-guide-manual">
          <div>
            <h4>Catalog</h4>
            <p>
              <Link to="/vendor/products">Add product</Link> ·{" "}
              <Link to="/vendor/product-table">All products</Link> ·{" "}
              <Link to="/vendor/media">Media</Link> ·{" "}
              <Link to="/vendor/inventory">Inventory</Link>
            </p>
          </div>
          <div>
            <h4>Sales</h4>
            <p>
              <Link to="/vendor/orders">Orders</Link> ·{" "}
              <Link to="/vendor/payments">Customer payments</Link> ·{" "}
              <Link to="/vendor/payouts">Payouts</Link>
            </p>
          </div>
          <div>
            <h4>Growth</h4>
            <p>
              <Link to="/vendor/coupons">Discounts</Link> ·{" "}
              <Link to="/vendor/marketing">Marketing</Link> ·{" "}
              <Link to="/vendor/reviews">Reviews</Link> ·{" "}
              <Link to="/vendor/support">Inbox</Link>
            </p>
          </div>
          <div>
            <h4>Policies</h4>
            <p>
              <Link to="/vendor/terms">Seller terms & weekly BS</Link>
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default VendorGuide;
