import { Link, useOutletContext } from "react-router-dom";

const THEMES = [
  {
    id: "light",
    title: "Light",
    blurb: "Default Shopify-style admin.",
    icon: "fa-solid fa-sun",
  },
  {
    id: "dark",
    title: "Dark",
    blurb: "Lower glare for long sessions.",
    icon: "fa-solid fa-moon",
  },
];

const VendorSettings = () => {
  const { theme, setTheme } = useOutletContext() || {};

  return (
    <div className="stack-gap vendor-settings">
      <section className="vendor-hero">
        <div className="vendor-hero-copy">
          <h2 className="page-title">Appearance</h2>
          <p className="page-subtitle">Theme for this device</p>
        </div>
      </section>

      <section className="form-card vendor-settings-section">
        <div className="vendor-settings-head">
          <div>
            <h3>Theme</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Saved in this browser only.
            </p>
          </div>
          <span className="status-chip vendor-theme-chip">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </div>
        <div className="vendor-theme-grid" role="radiogroup" aria-label="Theme">
          {THEMES.map((opt) => {
            const selected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`vendor-theme-card${selected ? " is-selected" : ""}`}
                onClick={() => setTheme?.(opt.id)}
                aria-pressed={selected}
              >
                <span className="vendor-theme-preview" data-preview={opt.id}>
                  <i className={opt.icon} aria-hidden="true" />
                </span>
                <span className="vendor-theme-copy">
                  <strong>{opt.title}</strong>
                  <span className="muted">{opt.blurb}</span>
                </span>
                {selected ? (
                  <i className="fa-solid fa-circle-check vendor-theme-check" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="form-card vendor-settings-section">
        <h3>Shortcuts</h3>
        <div className="vendor-settings-links">
          <Link className="panel-btn secondary" to="/vendor/store">
            Store details
          </Link>
          <Link className="panel-btn secondary" to="/vendor/profile">
            Profile
          </Link>
          <Link className="panel-btn secondary" to="/vendor/change-password">
            Password
          </Link>
          <Link className="panel-btn secondary" to="/vendor/orders">
            Orders
          </Link>
        </div>
      </section>
    </div>
  );
};

export default VendorSettings;
