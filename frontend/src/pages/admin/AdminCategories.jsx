import { useEffect, useState } from "react";
import { categoryApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";

const emptyForm = { name: "", slug: "", description: "" };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await categoryApi.list({ all: "true" });
      setCategories(res.data.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(categories, { pageSize: 10 });

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await categoryApi.create(form);
      setForm(emptyForm);
      notify.success("Category created.");
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(category) {
    try {
      await categoryApi.update(category._id, { status: !category.status });
      await load();
    } catch (err) {
      notify.fromError(err, "Failed to update category.");
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">Categories</h2>
        <p className="page-subtitle">
          Organize the marketplace catalog so customers can browse by category.
        </p>
      </div>

      <div className="form-card">
        <h3>Add category</h3>
        <form className="stack-gap" onSubmit={handleCreate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              placeholder="Slug (optional)"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="panel-btn" disabled={submitting}>
            {submitting ? "Saving..." : "Create Category"}
          </button>
        </form>
      </div>

      {loading ? <p className="muted">Loading...</p> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((cat) => (
              <tr key={cat._id}>
                <td>{cat.name}</td>
                <td>{cat.slug}</td>
                <td>{cat.status ? "Active" : "Hidden"}</td>
                <td>
                  <button
                    type="button"
                    className={cat.status ? "panel-btn danger" : "panel-btn"}
                    onClick={() => toggleStatus(cat)}
                  >
                    {cat.status ? "Hide" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 ? (
              <tr>
                <td colSpan={4}>No categories yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AdminCategories;
