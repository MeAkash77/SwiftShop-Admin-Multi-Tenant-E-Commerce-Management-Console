import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { payoutApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import TableRowActions from "../../components/shared/TableRowActions";
import usePagination from "../../hooks/usePagination";
import AdminReasonModal from "../../components/admin/AdminReasonModal";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const statusTone = {
  Requested: "status-chip--pay-pending",
  Paid: "status-chip--pay-paid",
  Rejected: "status-chip--pay-failed",
};

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await payoutApi.list();
      setPayouts(res.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return payouts;
    return payouts.filter((p) => p.status === filter);
  }, [payouts, filter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, { pageSize: 10, resetKey: filter });

  const requested = payouts.filter((p) => p.status === "Requested");
  const requestedTotal = requested.reduce((s, p) => s + (p.amount || 0), 0);
  const paidTotal = payouts
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + (p.amount || 0), 0);

  async function confirmPay(reference) {
    if (!payTarget) return;
    setBusyId(payTarget._id);
    try {
      await payoutApi.pay(payTarget._id, { reference });
      notify.success("Payout marked as paid.");
      setPayTarget(null);
      await load();
    } catch (err) {
      notify.fromError(err, "Unable to mark paid.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(reason) {
    if (!rejectTarget) return;
    setBusyId(rejectTarget._id);
    try {
      await payoutApi.reject(rejectTarget._id, { adminNote: reason });
      notify.success("Payout rejected.");
      setRejectTarget(null);
      await load();
    } catch (err) {
      notify.fromError(err, "Unable to reject.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Payouts</h2>
        <p className="page-subtitle">
          Review vendor withdrawal requests and pay out collected earnings.
        </p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Pending requests</p>
          <h3>{requested.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Pending amount</p>
          <h3>₹{requestedTotal}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Total paid out</p>
          <h3>₹{paidTotal}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">All requests</p>
          <h3>{payouts.length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All payouts</option>
          <option value="Requested">Requested</option>
          <option value="Paid">Paid</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading payouts...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Store</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  {p.store?._id ? (
                    <Link to={`/admin/stores/${p.store._id}`}>
                      {p.store?.storeName || "—"}
                    </Link>
                  ) : (
                    p.store?.storeName || "—"
                  )}
                </td>
                <td>
                  <div>
                    {[p.vendor?.firstName, p.vendor?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      p.vendor?.name ||
                      "—"}
                  </div>
                  <small className="muted">{p.vendor?.email || ""}</small>
                </td>
                <td>₹{p.amount}</td>
                <td>{p.method}</td>
                <td>
                  <small className="muted">
                    {p.method === "UPI"
                      ? p.upiId || "—"
                      : p.accountNumber
                        ? `${p.accountName || ""} ${p.accountNumber} · ${p.ifsc}`
                        : "—"}
                  </small>
                  {p.note ? (
                    <div>
                      <small className="muted">“{p.note}”</small>
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className={`status-chip ${statusTone[p.status] || ""}`}>
                    {p.status}
                  </span>
                  {p.reference ? (
                    <div>
                      <small className="muted">Ref: {p.reference}</small>
                    </div>
                  ) : null}
                  {p.status === "Rejected" && p.adminNote ? (
                    <div>
                      <small className="muted">{p.adminNote}</small>
                    </div>
                  ) : null}
                </td>
                <td className="row-actions">
                  {p.status === "Requested" ? (
                    <TableRowActions
                      items={[
                        {
                          key: "pay",
                          label: "Pay",
                          disabled: busyId === p._id,
                          onClick: () => setPayTarget(p),
                        },
                        {
                          key: "reject",
                          label: "Reject",
                          tone: "danger",
                          disabled: busyId === p._id,
                          onClick: () => setRejectTarget(p),
                        },
                      ]}
                    />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? (
          <p className="muted">No payout requests.</p>
        ) : null}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>

      <AdminReasonModal
        open={Boolean(payTarget)}
        title={`Pay ₹${payTarget?.amount || 0} to ${payTarget?.store?.storeName || "vendor"}`}
        description="Confirm you have transferred the funds. Optionally add a transaction reference."
        confirmLabel="Mark as paid"
        danger={false}
        reasonRequired={false}
        reasonLabel="Transaction reference (optional)"
        busy={busyId === payTarget?._id}
        onCancel={() => setPayTarget(null)}
        onConfirm={confirmPay}
      />

      <AdminReasonModal
        open={Boolean(rejectTarget)}
        title={`Reject payout of ₹${rejectTarget?.amount || 0}`}
        description="The reserved amount will be released back to the vendor's available balance."
        confirmLabel="Reject request"
        danger
        reasonLabel="Reason for rejection"
        busy={busyId === rejectTarget?._id}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />
    </div>
  );
};

export default AdminPayouts;
