import { useEffect, useMemo, useState } from "react";
import { userApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const params = filter === "all" ? {} : { status: filter };
        const response = await userApi.list(params);
        if (!active) return;
        setUsers(response.data.data || []);
      } catch (err) {
        if (!active) return;
        notify.fromError(err, "Failed to load users.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filter]);

  async function reloadUsers() {
    setLoading(true);
    try {
      const params = filter === "all" ? {} : { status: filter };
      const response = await userApi.list(params);
      setUsers(response.data.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const active = users.filter((user) => user.isActive !== false).length;
    const inactive = users.filter((user) => user.isActive === false).length;
    return { active, inactive, total: users.length };
  }, [users]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(users, {
    pageSize: 10,
    resetKey: filter,
  });

  async function handleToggle(user) {
    const nextStatus = user.isActive === false;
    const action = nextStatus ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) {
      return;
    }

    try {
      await userApi.toggleStatus(user._id, nextStatus);
      notify.success(nextStatus ? `${user.email} activated successfully.` : `${user.email} deactivated successfully.`);
      await reloadUsers();
    } catch (err) {
      notify.fromError(err, "Failed to update user status.");
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Users</h2>
        <p className="page-subtitle">
          Activate or deactivate platform users. Deactivated users cannot login.
        </p>
      </div>

      <div className="card-grid">
        <div className="entity-card">
          <p className="muted">Shown Users</p>
          <h3>{counts.total}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Active (in list)</p>
          <h3>{counts.active}</h3>
        </div>
        <div className="entity-card">
          <p className="muted">Inactive (in list)</p>
          <h3>{counts.inactive}</h3>
        </div>
      </div>

      <div className="search-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All users</option>
          <option value="active">Active only</option>
          <option value="inactive">Deactivated only</option>
        </select>
        <button type="button" className="panel-btn secondary" onClick={reloadUsers}>
          Refresh
        </button>
      </div>
      {loading ? <p className="muted">Loading users...</p> : null}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((user) => {
              const isActive = user.isActive !== false;
              return (
                <tr key={user._id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="status-chip">{user.role}</span>
                  </td>
                  <td>{user.isEmailVerified ? "Yes" : "No"}</td>
                  <td>
                    <span className="status-chip">
                      {isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className={isActive ? "panel-btn danger" : "panel-btn"}
                      onClick={() => handleToggle(user)}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && users.length === 0 ? (
          <p className="muted">No users found for this filter.</p>
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

export default AdminUsers;
