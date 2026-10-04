import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatCountdown, msUntilEndOfDay } from "../../utils/visitTracker";
import StableProductImage from "./StableProductImage";

const PERKS = [
  {
    icon: "fa-solid fa-truck-fast",
    title: "Fast delivery",
    text: "Store shipping that matches your cart total",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Secure checkout",
    text: "Razorpay online pay or cash on delivery",
  },
  {
    icon: "fa-solid fa-rotate-left",
    title: "Easy returns",
    text: "Request returns after delivery from Orders",
  },
  {
    icon: "fa-solid fa-comments",
    title: "MultiAssist help",
    text: "Order chat anytime — tap Help on any page",
  },
];

export function TrustPerkStrip() {
  return (
    <section className="cx-trust" aria-label="Why shop MultiCommerce">
      {PERKS.map((perk) => (
        <article key={perk.title} className="cx-trust-card">
          <span className="cx-trust-icon" aria-hidden="true">
            <i className={perk.icon} />
          </span>
          <div>
            <h3>{perk.title}</h3>
            <p>{perk.text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

export function DealCountdown({ className = "" }) {
  const [ms, setMs] = useState(msUntilEndOfDay);

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilEndOfDay()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`cx-countdown ${className}`}>
      <i className="fa-regular fa-clock" aria-hidden="true" /> Ends in{" "}
      <strong>{formatCountdown(ms)}</strong>
    </span>
  );
}

export function WelcomeBackBanner({ visit }) {
  if (!visit?.isReturning) return null;
  const away =
    visit.hoursAway != null && visit.hoursAway >= 12
      ? visit.hoursAway >= 48
        ? "Welcome back — fresh deals are waiting."
        : "Nice to see you again today."
      : "Picking up where you left off?";

  return (
    <div className="cx-welcome">
      <div>
        <strong>{away}</strong>
        <p>Recently viewed items and today’s deals are saved for you on this device.</p>
      </div>
      <div className="cx-welcome-actions">
        <Link className="shop-btn shop-btn-primary" to="/customer/products">
          Resume shopping
        </Link>
        <button
          type="button"
          className="shop-btn shop-btn-outline"
          onClick={() => document.querySelector(".mc-chat-fab")?.click()}
        >
          Need help?
        </button>
      </div>
    </div>
  );
}

export function RecentlyViewedRail({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="shop-section cx-recent">
      <div className="shop-section-head">
        <div>
          <h2>Continue shopping</h2>
          <p className="cx-section-sub">Products you viewed on this device</p>
        </div>
        <Link to="/customer/products">Browse more</Link>
      </div>
      <div className="cx-recent-rail">
        {items.map((item) => (
          <Link
            key={item.productId}
            to={`/customer/products/${item.productId}`}
            className="cx-recent-card"
          >
            {item.image ? (
              <StableProductImage
                src={item.image}
                alt=""
                className="cx-recent-media"
              />
            ) : (
              <span className="cx-recent-ph">No image</span>
            )}
            <strong>{item.name}</strong>
            <span>₹{Number(item.price || 0).toLocaleString("en-IN")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
