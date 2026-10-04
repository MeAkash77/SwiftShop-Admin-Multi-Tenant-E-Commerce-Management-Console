import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { orderApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import TableRowActions from "../../components/shared/TableRowActions";
import usePagination from "../../hooks/usePagination";
import { notify } from "../../utils/notify";
import { downloadOrderInvoice } from "../../utils/downloadOrderInvoice";
import { canDownloadInvoice } from "../../utils/canDownloadInvoice";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all",
  );
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState(null);
  const highlight = searchParams.get("highlight");

  async function load() {
    setLoading(true);
    try {
      const response = await orderApi.listAll();
      setOrders(response.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`order-${highlight}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight, orders]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.orderStatus === statusFilter);
  }, [orders, statusFilter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, {
      pageSize: 10,
      resetKey: statusFilter,
    });

  async function updateStatus(orderId, status) {
    try {
      await orderApi.updateStatus(orderId, status);
      notify.success(`Order updated to ${status}.`);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update status.");
    }
  }

  async function removeOrder(order) {
    if (!window.confirm(`Delete order ${order.orderNumber || order._id}?`))
      return;
    try {
      await orderApi.remove(order._id);
      notify.success("Order deleted.");
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to delete order.");
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Orders</h2>
        <p className="page-subtitle">
          Platform-wide order lifecycle across all stores.
        </p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Total Orders</p>
          <h3>{orders.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Pending</p>
          <h3>{orders.filter((o) => o.orderStatus === "Pending").length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Delivered</p>
          <h3>{orders.filter((o) => o.orderStatus === "Delivered").length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading orders...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Store</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((order) => (
              <tr
                key={order._id}
                id={`order-${order._id}`}
                style={
                  highlight === order._id
                    ? { outline: "2px solid #2563eb", outlineOffset: -2 }
                    : undefined
                }
              >
                <td>
                  <strong>{order.orderNumber || order._id}</strong>
                </td>
                <td>
                  {order.customerId ? (
                    <>
                      <div>
                        {order.customerId.firstName} {order.customerId.lastName}
                      </div>
                      <div className="muted">{order.customerId.email}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{order.storeId?.storeName || "—"}</td>
                <td>
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="status-chip">{order.paymentStatus}</span>
                </td>
                <td>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(order.totalAmount || 0)}
                </td>
                <td className="row-actions">
                  <TableRowActions
                    items={[
                      canDownloadInvoice(order)
                        ? {
                            key: "invoice",
                            label: invoiceId === order._id ? "…" : "Invoice",
                            disabled: invoiceId === order._id,
                            onClick: async () => {
                              setInvoiceId(order._id);
                              try {
                                await downloadOrderInvoice(
                                  order._id,
                                  order.orderNumber
                                );
                              } catch (err) {
                                notify.fromError(err, "Invoice download failed.");
                              } finally {
                                setInvoiceId(null);
                              }
                            },
                          }
                        : null,
                      {
                        key: "delete",
                        label: "Delete",
                        tone: "danger",
                        onClick: () => removeOrder(order),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? (
          <p className="muted">No orders found.</p>
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
    </div>
  );
};

export default AdminOrders;
