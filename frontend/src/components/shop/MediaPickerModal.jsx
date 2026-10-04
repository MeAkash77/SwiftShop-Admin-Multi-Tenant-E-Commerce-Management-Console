import { useCallback, useEffect, useState } from "react";
import { mediaApi, unwrapList } from "../../api/services";
import { notify } from "../../utils/notify";
import "./MediaPickerModal.css";

/**
 * Paginated vendor media gallery picker.
 * Supports ~500+ images via page/limit — never loads the full library.
 */
const MediaPickerModal = ({
  open,
  onClose,
  onConfirm,
  maxSelect = 8,
  excludePublicIds = [],
  title = "Select from Media",
}) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => new Map());
  const [uploading, setUploading] = useState(false);

  const exclude = new Set(excludePublicIds.map(String));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list({ page, limit: 24, q: query || undefined });
      const payload = unwrapList(res.data);
      setItems(payload.data);
      setTotalPages(payload.totalPages || 1);
      setTotal(payload.total || 0);
    } catch (err) {
      notify.fromError(err, "Could not load media library");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setSelected(new Map());
      setQ("");
      setQuery("");
      setPage(1);
    }
  }, [open]);

  if (!open) return null;

  function toggle(asset) {
    if (exclude.has(String(asset.public_id))) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(asset.public_id)) {
        next.delete(asset.public_id);
      } else {
        if (next.size >= maxSelect) {
          notify.warning(`You can select up to ${maxSelect} images`);
          return prev;
        }
        next.set(asset.public_id, {
          public_id: asset.public_id,
          url: asset.url,
        });
      }
      return next;
    });
  }

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
      await load();
    } catch (err) {
      notify.fromError(err, "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function confirm() {
    onConfirm?.([...selected.values()]);
    onClose?.();
  }

  return (
    <div className="media-picker-backdrop" role="dialog" aria-modal="true">
      <div className="media-picker-panel">
        <header className="media-picker-head">
          <div>
            <h3>{title}</h3>
            <p>
              {total} in library · select up to {maxSelect} · page {page}/{totalPages}
            </p>
          </div>
          <button type="button" className="panel-btn secondary" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="media-picker-toolbar">
          <form
            className="media-picker-search"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <input
              type="search"
              placeholder="Search filename…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" className="panel-btn secondary">
              Search
            </button>
          </form>
          <label className="panel-btn">
            {uploading ? "Uploading…" : "Upload to library"}
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

        {loading ? (
          <p className="muted" style={{ padding: "1rem" }}>
            Loading…
          </p>
        ) : !items.length ? (
          <div className="vendor-empty">
            <p>No images yet. Upload product photos to build your library (works with 500+).</p>
          </div>
        ) : (
          <div className="media-picker-grid">
            {items.map((asset) => {
              const isExcluded = exclude.has(String(asset.public_id));
              const isOn = selected.has(asset.public_id);
              return (
                <button
                  key={asset._id}
                  type="button"
                  className={`media-picker-tile${isOn ? " is-selected" : ""}${
                    isExcluded ? " is-disabled" : ""
                  }`}
                  disabled={isExcluded}
                  onClick={() => toggle(asset)}
                  title={asset.originalName || asset.public_id}
                >
                  <img src={asset.url} alt="" loading="lazy" />
                  {isOn ? <span className="media-picker-check">✓</span> : null}
                  {isExcluded ? <span className="media-picker-used">On product</span> : null}
                </button>
              );
            })}
          </div>
        )}

        <footer className="media-picker-foot">
          <div className="media-picker-pager">
            <button
              type="button"
              className="panel-btn secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="panel-btn secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
          <div className="media-picker-confirm">
            <span className="muted">{selected.size} selected</span>
            <button
              type="button"
              className="panel-btn"
              disabled={!selected.size}
              onClick={confirm}
            >
              Add to product
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MediaPickerModal;
