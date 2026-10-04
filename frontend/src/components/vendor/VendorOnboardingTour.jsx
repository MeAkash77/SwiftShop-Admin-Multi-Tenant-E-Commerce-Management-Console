import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TOUR_DISMISS_KEY = "mc-vendor-tour-dismissed-v1";

/**
 * First-login style coach card — dismissible, like modern mobile apps.
 */
export default function VendorOnboardingTour() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_DISMISS_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  function dismiss() {
    localStorage.setItem(TOUR_DISMISS_KEY, "1");
    setOpen(false);
  }

  return (
    <div className="vendor-tour" role="dialog" aria-label="Seller getting started">
      <div className="vendor-tour-card">
        <button
          type="button"
          className="vendor-tour-close"
          onClick={dismiss}
          aria-label="Dismiss guide"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <p className="vendor-tour-kicker">Welcome, seller</p>
        <h3>Start with a 2-minute setup guide</h3>
        <p>
          Create your store, add a product, fulfill orders, then withdraw earnings —
          including weekly bank settlement or anytime payout.
        </p>
        <div className="vendor-tour-actions">
          <Link className="panel-btn" to="/vendor/guide" onClick={dismiss}>
            Open getting started
          </Link>
          <button type="button" className="panel-btn secondary" onClick={dismiss}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
