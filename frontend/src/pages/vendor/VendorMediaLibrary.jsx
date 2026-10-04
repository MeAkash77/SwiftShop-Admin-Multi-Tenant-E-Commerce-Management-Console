import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mediaApi, unwrapList } from "../../api/services";
import { notify } from "../../utils/notify";

/**
 * Full Media library page — upload & browse 500+ images with pagination.
 */
const VendorMediaLibrary = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list({ page, limit: 36, q: query || undefined });
      const payload = unwrapList(res.data);
      setItems(payload.data);
      setTotalPages(payload.totalPages || 1);
      setTotal(payload.total || 0);
    } catch (err) {
      notify.fromError(err, "Unable to load media");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.slice(0, 20).forEach((f) => formData.append("images", f));
      const res = await mediaApi.upload(formData);
      notify.success(res.data?.message || "Uploaded");
      setPage(1);
      setQuery("");
      setQ("");
      await load();
    } catch (err) {
      notify.fromError(err, "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset) {
    if (!window.confirm(`Remove "${asset.originalName || "image"}" from library?`)) {
      return;
    }
    setBusyId(asset._id);
    try {
      await mediaApi.remove(asset._id);
      notify.success("Deleted");
      await load();
    } catch (err) {
      notify.fromError(err, "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-row">
          <div className="vendor-hero-copy">
            <h2 className="page-title">Media</h2>
            <p className="page-subtitle">
              Shared image library ({total}) — reuse across products. Paginated for large catalogs.
            </p>
          </div>
          <div className="vendor-hero-actions">
            <Link className="panel-btn secondary" to="/vendor/products">
              Add product
            </Link>
            <label className="panel-btn">
              {uploading ? "Uploading…" : "Upload images"}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={uploading}
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>
      </section>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search filename…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              setQuery(q.trim());
            }
          }}
        />
        <button
          type="button"
          className="panel-btn secondary"
          onClick={() => {
            setPage(1);
            setQuery(q.trim());
          }}
        >
          Search
        </button>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="muted" style={{ padding: "1rem" }}>
            Loading…
          </p>
        ) : !items.length ? (
          <div className="vendor-empty">
            <p>Upload product photos here, then pick them when adding products.</p>
            <label className="panel-btn">
              Upload images
              <input type="file" accept="image/*" multiple hidden onChange={handleUpload} />
            </label>
          </div>
        ) : (
          <>
            <div className="vendor-media-grid">
              {items.map((asset) => (
                <article key={asset._id} className="vendor-media-card">
                  <img src={asset.url} alt={asset.originalName || ""} loading="lazy" />
                  <div className="vendor-media-meta">
                    <span title={asset.originalName || asset.public_id}>
                      {asset.originalName || "Image"}
                    </span>
                    <button
                      type="button"
                      className="panel-btn secondary"
                      disabled={busyId === asset._id}
                      onClick={() => handleDelete(asset)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="vendor-media-pager">
              <button
                type="button"
                className="panel-btn secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="panel-btn secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorMediaLibrary;
