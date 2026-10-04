import { Link } from "react-router-dom";
import "../../layouts/PanelLayout.css";

/**
 * Vendor Terms — weekly bank settlement (BS) + anytime withdrawal policy.
 */
const VendorTerms = () => {
  return (
    <div className="stack-gap vendor-policy">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Seller terms & payout policy</h2>
            <p className="page-subtitle">
              How MultiCommerce settles earnings, weekly bank settlement (BS), and
              withdrawals you can request anytime.
            </p>
          </div>
          <div className="vendor-hero-actions">
            <Link className="panel-btn" to="/vendor/payouts">
              Open payouts
            </Link>
            <Link className="panel-btn secondary" to="/vendor/guide">
              Getting started
            </Link>
          </div>
        </div>
      </section>

      <article className="form-card vendor-policy-card">
        <h3>1. Acceptance</h3>
        <p>
          By registering as a seller and creating a store on MultiCommerce, you agree
          to these Seller Terms, the marketplace rules, and applicable law. If you do
          not agree, do not list products or accept orders.
        </p>

        <h3>2. Customer payments vs seller payouts</h3>
        <p>
          When a customer pays (online or COD collected), that payment is received by
          the platform for the order. Your <strong>seller earnings</strong> are tracked
          separately and become available for payout after order payment is marked{" "}
          <strong>Paid</strong> (and subject to returns / holds).
        </p>

        <h3>3. Weekly automatic bank settlement (BS)</h3>
        <ul>
          <li>
            MultiCommerce runs a <strong>weekly bank settlement (BS)</strong> cycle for
            eligible sellers who have saved valid bank / UPI details.
          </li>
          <li>
            Eligible available balance can be auto-scheduled for transfer once per week
            (typically processed after the weekend settlement window).
          </li>
          <li>
            You can keep weekly BS enabled and still request a manual withdrawal when
            you need funds sooner.
          </li>
          <li>
            Settlement may be delayed if KYC/bank details are incomplete, a store is
            suspended, or an order is under dispute / return.
          </li>
        </ul>

        <h3>4. Withdraw anytime</h3>
        <ul>
          <li>
            From <Link to="/vendor/payouts">Payouts</Link>, request a withdrawal of any
            amount up to your <strong>available balance</strong>, whenever you need it.
          </li>
          <li>Choose <strong>Bank transfer</strong> or <strong>UPI</strong>.</li>
          <li>
            Admin reviews pending requests and marks them Paid or Rejected. You will
            see status updates on Payouts and in Notifications.
          </li>
          <li>
            You may cancel a request while it is still <strong>Pending</strong>.
          </li>
        </ul>

        <h3>5. Holds, fees & adjustments</h3>
        <p>
          Platform may hold funds for cancelled / returned orders, chargebacks, or
          policy violations. Any published commission or processing fees are deducted
          before available balance. Fraudulent activity can freeze payouts.
        </p>

        <h3>6. Your responsibilities</h3>
        <ul>
          <li>Keep catalog, stock, and shipping details accurate.</li>
          <li>Fulfill orders on time and update order status honestly.</li>
          <li>Provide correct bank / UPI details for settlements.</li>
          <li>Respond to customer support chats for your store.</li>
        </ul>

        <h3>7. Changes</h3>
        <p>
          MultiCommerce may update this policy. Material changes will appear here and
          may be announced in seller Notifications. Continued use of the seller portal
          means you accept the updated terms.
        </p>

        <p className="muted" style={{ marginTop: 24 }}>
          Last updated: July 2026 · Questions? Use{" "}
          <Link to="/vendor/guide">Getting started</Link> or Inbox support tools.
        </p>
      </article>
    </div>
  );
};

export default VendorTerms;
