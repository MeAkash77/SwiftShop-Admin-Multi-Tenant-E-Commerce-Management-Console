import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { payoutApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import VendorRowActions from "../../components/vendor/VendorRowActions";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";
import { payoutStatusChipClass } from "../../utils/vendorStatus";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const EMPTY_FORM = {
  amount: "",
  method: "Bank",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  note: "",
};

const VendorPayouts = () => {
  const [balance, setBalance] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [balRes, listRes] = await Promise.all([
        payoutApi.balance(),
        payoutApi.mine(),
      ]);
      setBalance(balRes.data?.data || null);
      setPayouts(listRes.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Unable to load payouts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const available = balance?.available || 0;

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(payouts, { pageSize: 8 });

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      notify.error("Enter a valid amount.");
      return;
    }
    if (amount > available) {
      notify.error(`Amount exceeds available balance (₹${available}).`);
      return;
    }
    setSubmitting(true);
    try {
      await payoutApi.request({
        amount,
        method: form.method,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
        upiId: form.upiId,
        note: form.note,
      });
      notify.success("Withdrawal request submitted.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      notify.fromError(err, "Withdrawal request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id) {
    setCancelingId(id);
    try {
      await payoutApi.cancel(id);
      notify.success("Request cancelled.");
      await load();
    } catch (err) {
      notify.fromError(err, "Unable to cancel request.");
    } finally {
      setCancelingId(null);
    }
  }

  const totalPaidOut = useMemo(
    () =>
      payouts
        .filter((p) => p.status === "Paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    [payouts]
  );

  const quickAmounts = useMemo(
    () =>
      [0.25, 0.5, 1]
        .map((ratio) => Math.floor(available * ratio))
        .filter((amount, index, list) => amount >= 1 && list.indexOf(amount) === index),
    [available]
  );

  return (
    <div className="stack-gap vendor-payout-page">
      <section className="vendor-hero vendor-payout-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <p className="vendor-payout-kicker">Finance</p>
            <h2 className="page-title">Payouts</h2>
            <p className="page-subtitle">
              Manage earnings, request a transfer, and track every settlement.
              Weekly bank settlement (BS) can also pay eligible earnings — see{" "}
              <Link to="/vendor/terms">Seller terms</Link>.
            </p>
          </div>
          <div className="vendor-hero-actions">
            <button
              type="button"
              className="panel-btn secondary"
              onClick={load}
              disabled={loading}
            >
              <i className="fa-solid fa-rotate" aria-hidden="true" />
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="vendor-payout-summary" aria-label="Payout balance summary">
        <div className="vendor-payout-balance">
          <span className="vendor-payout-summary-icon" aria-hidden="true">
            <i className="fa-solid fa-wallet" />
          </span>
          <div>
            <p>Available to withdraw</p>
            <strong>{loading ? "—" : formatMoney(available)}</strong>
            <small>Ready for Bank or UPI transfer</small>
          </div>
        </div>
        <div className="vendor-payout-metric">
          <span>Total collected</span>
          <strong>{loading ? "—" : formatMoney(balance?.earned)}</strong>
          <small>Paid customer orders</small>
        </div>
        <div className="vendor-payout-metric">
          <span>Pending requests</span>
          <strong>{loading ? "—" : formatMoney(balance?.pending)}</strong>
          <small>Waiting for review</small>
        </div>
        <div className="vendor-payout-metric">
          <span>Paid out</span>
          <strong>{loading ? "—" : formatMoney(totalPaidOut)}</strong>
          <small>Completed transfers</small>
        </div>
      </section>

      <section className="vendor-payout-workspace">
        <div className="form-card vendor-payout-form-card">
          <div className="vendor-payout-section-head">
            <div>
              <p className="vendor-payout-kicker">New transfer</p>
              <h3>Request a withdrawal</h3>
              <p>Choose an amount and where you want to receive it.</p>
            </div>
            <span className="vendor-payout-secure">
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />
              Secure request
            </span>
          </div>

          <form className="vendor-payout-form" onSubmit={submit}>
            <div className="vendor-payout-form-section">
              <div className="vendor-payout-form-label">
                <span>1</span>
                <div>
                  <strong>Withdrawal amount</strong>
                  <small>Maximum {formatMoney(available)} available</small>
                </div>
              </div>
              <label className="vendor-payout-amount" htmlFor="payout-amount">
                <span>₹</span>
                <input
                  id="payout-amount"
                  type="number"
                  name="amount"
                  min="1"
                  max={available}
                  value={form.amount}
                  onChange={onChange}
                  placeholder="Enter amount"
                  required
                />
              </label>
              {quickAmounts.length ? (
                <div className="vendor-payout-quick" aria-label="Quick amounts">
                  {quickAmounts.map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      className={Number(form.amount) === amount ? "is-active" : ""}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, amount: String(amount) }))
                      }
                    >
                      {amount === available ? "All" : formatMoney(amount)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="vendor-payout-form-section">
              <div className="vendor-payout-form-label">
                <span>2</span>
                <div>
                  <strong>Transfer method</strong>
                  <small>Select Bank transfer or UPI</small>
                </div>
              </div>
              <div className="vendor-payout-methods">
                {[
                  {
                    value: "Bank",
                    title: "Bank transfer",
                    detail: "Direct to your bank account",
                    icon: "fa-building-columns",
                  },
                  {
                    value: "UPI",
                    title: "UPI",
                    detail: "Send to a verified UPI ID",
                    icon: "fa-mobile-screen-button",
                  },
                ].map((method) => (
                  <button
                    type="button"
                    key={method.value}
                    className={`vendor-payout-method${
                      form.method === method.value ? " is-active" : ""
                    }`}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, method: method.value }))
                    }
                  >
                    <span className="vendor-payout-method-icon" aria-hidden="true">
                      <i className={`fa-solid ${method.icon}`} />
                    </span>
                    <span className="vendor-payout-method-copy">
                      <strong>{method.title}</strong>
                      <small>{method.detail}</small>
                    </span>
                    <span
                      className={`vendor-payout-method-check${
                        form.method === method.value ? " is-on" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <i
                        className={`fa-${
                          form.method === method.value ? "solid" : "regular"
                        } fa-circle-check`}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="vendor-payout-form-section">
              <div className="vendor-payout-form-label">
                <span>3</span>
                <div>
                  <strong>Destination details</strong>
                  <small>Use details matching your verified account</small>
                </div>
              </div>
              <div className="vendor-payout-fields">
                <label>
                  <span>Account holder name</span>
                  <input
                    type="text"
                    name="accountName"
                    value={form.accountName}
                    onChange={onChange}
                    placeholder="Name as per bank records"
                    required
                  />
                </label>

                {form.method === "Bank" ? (
                  <>
                    <label>
                      <span>Account number</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={onChange}
                        placeholder="Enter bank account number"
                        required
                      />
                    </label>
                    <label>
                      <span>IFSC code</span>
                      <input
                        type="text"
                        name="ifsc"
                        value={form.ifsc}
                        onChange={onChange}
                        placeholder="Example: HDFC0001234"
                        autoCapitalize="characters"
                        required
                      />
                    </label>
                  </>
                ) : (
                  <label>
                    <span>UPI ID</span>
                    <input
                      type="text"
                      name="upiId"
                      value={form.upiId}
                      onChange={onChange}
                      placeholder="name@bank"
                      required
                    />
                  </label>
                )}

                <label className="vendor-payout-note">
                  <span>Note to admin <em>Optional</em></span>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={onChange}
                    placeholder="Add settlement instructions or a reference"
                    rows={3}
                  />
                </label>
              </div>
            </div>

            <div className="vendor-payout-submit">
              <div>
                <strong>
                  Request total: {formatMoney(Number(form.amount) || 0)}
                </strong>
                <small>Final transfer is reviewed before payment.</small>
              </div>
              <button
                type="submit"
                className="panel-btn"
                disabled={submitting || available < 1}
              >
                {submitting ? "Submitting…" : "Request withdrawal"}
              </button>
            </div>
            {available < 1 ? (
              <p className="vendor-payout-no-balance">
                No balance is available to withdraw yet.
              </p>
            ) : null}
          </form>
        </div>

        <aside className="form-card vendor-payout-aside">
          <span className="vendor-payout-aside-icon" aria-hidden="true">
            <i className="fa-solid fa-calendar-check" />
          </span>
          <p className="vendor-payout-kicker">Settlement schedule</p>
          <h3>Weekly BS + withdraw anytime</h3>
          <p>
            Eligible earnings may be included in the weekly bank settlement. Need
            funds sooner? Submit a manual request here.
          </p>
          <ul>
            <li>
              <i className="fa-solid fa-check" aria-hidden="true" />
              Bank and UPI supported
            </li>
            <li>
              <i className="fa-solid fa-check" aria-hidden="true" />
              Cancel while status is Requested
            </li>
            <li>
              <i className="fa-solid fa-check" aria-hidden="true" />
              Track references in payout history
            </li>
          </ul>
          <Link to="/vendor/terms">Read payout policy →</Link>
        </aside>
      </section>

      <section className="table-card vendor-payout-history">
        <div className="vendor-payout-section-head">
          <div>
            <p className="vendor-payout-kicker">Activity</p>
            <h3>Payout history</h3>
            <p>All manual requests and completed transfers in one place.</p>
          </div>
        </div>
        <div className="vendor-payout-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="vendor-payout-amount-cell">{formatMoney(p.amount)}</td>
                <td>
                  <span className="vendor-payout-method-chip">
                    <i
                      className={`fa-solid ${
                        p.method === "UPI"
                          ? "fa-mobile-screen-button"
                          : "fa-building-columns"
                      }`}
                      aria-hidden="true"
                    />
                    {p.method}
                  </span>
                </td>
                <td>
                  <small className="vendor-payout-destination">
                    {p.method === "UPI"
                      ? p.upiId || "—"
                      : p.accountNumber
                        ? `•••• ${String(p.accountNumber).slice(-4)} · ${p.ifsc}`
                        : "—"}
                  </small>
                </td>
                <td>
                  <span className={payoutStatusChipClass(p.status)}>
                    {p.status}
                  </span>
                  {p.status === "Rejected" && p.adminNote ? (
                    <div>
                      <small className="muted">{p.adminNote}</small>
                    </div>
                  ) : null}
                </td>
                <td>
                  <small className="muted">{p.reference || "—"}</small>
                </td>
                <td className="vendor-actions-cell">
                  <VendorRowActions
                    primary={
                      p.status === "Requested" ? (
                        <button
                          type="button"
                          className="panel-btn secondary"
                          disabled={cancelingId === p._id}
                          onClick={() => cancel(p._id)}
                        >
                          {cancelingId === p._id ? "…" : "Cancel"}
                        </button>
                      ) : null
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!loading && payouts.length === 0 ? (
          <div className="vendor-payout-empty">
            <i className="fa-solid fa-receipt" aria-hidden="true" />
            <strong>No payout activity yet</strong>
            <p>Your first withdrawal request will appear here.</p>
          </div>
        ) : null}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
};

export default VendorPayouts;
