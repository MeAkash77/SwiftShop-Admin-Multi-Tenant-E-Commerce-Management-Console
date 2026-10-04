import { useEffect, useMemo, useState } from "react";
import { orderApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const AdminSales = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await orderApi.listAll();
        if (!active) return;
        setOrders(response.data?.data || []);
      } catch (err) {
        if (!active) return;
        notify.fromError(err, "Failed to load sales.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "Paid"),
    [orders]
  );

  const totalSales = paidOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

  const byStore = useMemo(() => {
    const map = new Map();
    for (const order of paidOrders) {
      const key = order.storeId?._id || "unknown";
      const name = order.storeId?.storeName || "Unknown store";
      if (!map.has(key)) map.set(key, { name, orders: 0, sales: 0 });
      const row = map.get(key);
      row.orders += 1;
      row.sales += Number(order.totalAmount) || 0;
    }
    return [...map.values()].sort((a, b) => b.sales - a.sales);
  }, [paidOrders]);

  const recentPaidOrders = useMemo(
    () =>
      [...paidOrders].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [paidOrders]
  );

  const storePagination = usePagination(byStore, { pageSize: 10 });
  const ordersPagination = usePagination(recentPaidOrders, { pageSize: 10 });

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Sales</h2>
        <p className="page-subtitle">Paid sales performance across vendor stores.</p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Paid Orders</p>
          <h3>{paidOrders.length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Total Sales</p>
          <h3>{formatCurrency(totalSales)}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Stores with Sales</p>
          <h3>{byStore.length}</h3>
        </div>
      </div>
      {loading ? <p className="muted">Loading sales...</p> : null}

      <div className="table-card">
        <h3>Sales by Store</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Paid Orders</th>
              <th>Sales</th>
            </tr>
          </thead>
          <tbody>
            {storePagination.pageItems.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.orders}</td>
                <td>{formatCurrency(row.sales)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && byStore.length === 0 ? (
          <p className="muted">No paid sales yet.</p>
        ) : null}
        <Pagination
          page={storePagination.page}
          totalPages={storePagination.totalPages}
          totalItems={storePagination.totalItems}
          from={storePagination.from}
          to={storePagination.to}
          onPageChange={storePagination.setPage}
        />
      </div>

      <div className="table-card">
        <h3>Recent Paid Orders</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Store</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {ordersPagination.pageItems.map((order) => (
              <tr key={order._id}>
                <td>{order.orderNumber || order._id.slice(-8)}</td>
                <td>{order.storeId?.storeName || "—"}</td>
                <td>{order.customerId?.email || "—"}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && recentPaidOrders.length === 0 ? (
          <p className="muted">No paid orders yet.</p>
        ) : null}
        <Pagination
          page={ordersPagination.page}
          totalPages={ordersPagination.totalPages}
          totalItems={ordersPagination.totalItems}
          from={ordersPagination.from}
          to={ordersPagination.to}
          onPageChange={ordersPagination.setPage}
        />
      </div>
    </div>
  );
};

export default AdminSales;
