import { Link } from "react-router-dom";
import "./VendorPortal.css";

/**
 * Public seller terms (readable before login / from register).
 * Logged-in sellers also have /vendor/terms inside the panel.
 */
const VendorTermsPublic = () => {
  return (
    <div className="vendor-portal vendor-portal--terms">
      <div className="vendor-portal-card wide vendor-portal-terms-card">
        <p className="vendor-portal-eyebrow">Seller policy</p>
        <h1>Seller terms & payout policy</h1>
        <p className="vendor-portal-lead">
          Weekly bank settlement (BS), anytime withdrawals, and marketplace seller rules.
        </p>

        <article className="vendor-public-terms">
          <h2>1. Acceptance</h2>
          <p>
            By registering as a seller and creating a store on MultiCommerce, you agree
            to these Seller Terms, marketplace rules, and applicable law.
          </p>

          <h2>2. Customer payments vs seller payouts</h2>
          <p>
            Customer checkout payments are received for the order. Your seller earnings
            become available for payout after payment is marked Paid, subject to returns
            and holds.
          </p>

          <h2>3. Weekly automatic bank settlement (BS)</h2>
          <ul>
            <li>
              Eligible sellers with valid bank/UPI details may receive a weekly bank
              settlement (BS) of available balance.
            </li>
            <li>
              You can keep weekly BS and still request a manual withdrawal whenever you
              need funds sooner.
            </li>
            <li>
              Settlement may pause if bank details are incomplete, the store is
              suspended, or an order is in dispute/return.
            </li>
          </ul>

          <h2>4. Withdraw anytime</h2>
          <ul>
            <li>
              After login, open <strong>Payouts</strong> and request Bank or UPI withdrawal
              up to your available balance.
            </li>
            <li>Admin reviews Pending requests and marks them Paid or Rejected.</li>
            <li>You may cancel a request while it is still Pending.</li>
          </ul>

          <h2>5. Holds & responsibilities</h2>
          <p>
            Funds may be held for cancellations, returns, chargebacks, or policy issues.
            Keep catalog, stock, shipping, and bank details accurate, and fulfill orders
            promptly.
          </p>
        </article>

        <p className="vendor-portal-footer">
          <Link to="/vendor/register">Create seller account</Link>
          {" · "}
          <Link to="/vendor/login">Vendor login</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </div>
    </div>
  );
};

export default VendorTermsPublic;
