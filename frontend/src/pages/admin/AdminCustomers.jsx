import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { userApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import TableRowActions from "../../components/shared/TableRowActions";
import AdminReasonModal from "../../components/admin/AdminReasonModal";
import usePagination from "../../hooks/usePagination";
import { notify } from "../../utils/notify";

const AdminCustomers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(
    () => searchParams.get("role") || "customer",
  );
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await userApi.list({});
      setUsers(response.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role) setRoleFilter(role);
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (roleFilter === "all") return users;
    if (roleFilter === "vendor")
      return users.filter((u) => u.role === "vendor");
    if (roleFilter === "customer")
      return users.filter((u) => u.role === "customer");
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, { pageSize: 10, resetKey: roleFilter });

  function onRoleChange(value) {
    setRoleFilter(value);
    if (value === "customer") setSearchParams({});
    else setSearchParams({ role: value });
  }

  async function activate(user) {
    try {
      await userApi.toggleStatus(user._id, true);
      notify.success(`${user.email} activated.`);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update user.");
    }
  }

  async function onConfirmDeactivate(reason) {
    if (!modalUser) return;
    setBusy(true);
    try {
      await userApi.toggleStatus(modalUser._id, false);
      try {
        const key = `admin_note_customer_${modalUser._id}`;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({
          at: new Date().toISOString(),
          action: "deactivate",
          reason,
        });
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
      } catch {
        // ignore
      }
      notify.success(`${modalUser.email} deactivated.`);
      setModalUser(null);
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">
          {roleFilter === "vendor" ? "Vendors" : "Customers"}
        </h2>
        <p className="page-subtitle">
          Open a record for full context. Deactivate abuse with a reason.
        </p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Customers</p>
          <h3>{users.filter((u) => u.role === "customer").length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Vendors</p>
          <h3>{users.filter((u) => u.role === "vendor").length}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Admins</p>
          <h3>{users.filter((u) => u.role === "superAdmin").length}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
          <option value="all">All roles</option>
          <option value="superAdmin">Admins</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={load}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th className="aw-actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((user) => {
              const isActive = user.isActive !== false;
              const canOpen =
                user.role === "customer" || user.role === "vendor";
              return (
                <tr
                  key={user._id}
                  className={canOpen ? "aw-link-row" : undefined}
                  onClick={() => {
                    if (user.role === "customer") {
                      navigate(`/admin/customers/${user._id}`);
                    }
                  }}
                >
                  <td>
                    {user.role === "customer" ? (
                      <Link
                        to={`/admin/customers/${user._id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.firstName} {user.lastName}
                      </Link>
                    ) : (
                      <>
                        {user.firstName} {user.lastName}
                      </>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber || "—"}</td>
                  <td>
                    <span className="status-chip">{user.role}</span>
                  </td>
                  <td>
                    <span
                      className={`status-chip ${isActive ? "status-chip--ok" : "status-chip--bad"}`}
                    >
                      {isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td
                    className="aw-actions-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableRowActions
                      items={[
                        user.role === "customer"
                          ? {
                              key: "open",
                              label: "Open",
                              to: `/admin/customers/${user._id}`,
                            }
                          : null,
                        user.role !== "superAdmin"
                          ? isActive
                            ? {
                                key: "deactivate",
                                label: "Deactivate",
                                tone: "danger",
                                onClick: () => setModalUser(user),
                              }
                            : {
                                key: "activate",
                                label: "Activate",
                                onClick: () => activate(user),
                              }
                          : null,
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? (
          <p className="muted">No accounts found.</p>
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
        open={Boolean(modalUser)}
        title="Deactivate account"
        description={
          modalUser
            ? `${modalUser.email} will not be able to sign in until reactivated.`
            : ""
        }
        confirmLabel="Deactivate"
        onCancel={() => setModalUser(null)}
        onConfirm={onConfirmDeactivate}
        busy={busy}
      />
    </div>
  );
};

export default AdminCustomers;
