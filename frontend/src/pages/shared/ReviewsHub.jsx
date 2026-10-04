import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { reviewApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { notify } from "../../utils/notify";
import "./ReviewsHub.css";

function customerLabel(customer) {
  if (!customer) return { name: "Customer", email: "" };
  const name =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
    customer.name ||
    "Customer";
  return { name, email: customer.email || "" };
}

function Stars({ rating }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="rh-stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          className={n <= value ? "fa-solid fa-star" : "fa-regular fa-star"}
          style={{ opacity: n <= value ? 1 : 0.35 }}
        />
      ))}
      <em>{value}</em>
    </span>
  );
}

/**
 * Vendor: reviews on own products. Admin: all marketplace reviews.
 */
const ReviewsHub = ({ scope = "vendor" }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [photoFilter, setPhotoFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [removingId, setRemovingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const response = await reviewApi.manage();
      setReviews(response.data?.reviews || []);
    } catch (err) {
      notify.fromError(err, "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [scope]);

  const productOptions = useMemo(() => {
    const map = new Map();
    for (const r of reviews) {
      const p = r.product;
      if (p?._id) map.set(String(p._id), p.name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (selectedProduct && String(r.product?._id) !== selectedProduct) {
        return false;
      }
      if (ratingFilter !== "all" && Number(r.rating) !== Number(ratingFilter)) {
        return false;
      }
      const hasPhotos = Boolean(r.images?.length);
      if (photoFilter === "photos" && !hasPhotos) return false;
      if (photoFilter === "text" && hasPhotos) return false;
      if (q) {
        const { name, email } = customerLabel(r.customer);
        const hay = [
          r.product?.name,
          r.title,
          r.comment,
          name,
          email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, selectedProduct, ratingFilter, photoFilter, query]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [selectedProduct, ratingFilter, photoFilter, query, setPage]);

  const stats = useMemo(() => {
    const count = filtered.length;
    const avg =
      count === 0
        ? 0
        : filtered.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count;
    const withPhotos = filtered.filter((r) => r.images?.length).length;
    const low = filtered.filter((r) => Number(r.rating) <= 2).length;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of filtered) {
      const key = Math.round(Number(r.rating) || 0);
      if (dist[key] != null) dist[key] += 1;
    }
    return { count, avg, withPhotos, low, dist };
  }, [filtered]);

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this review from the marketplace?")) return;
    setRemovingId(id);
    try {
      await reviewApi.remove(id);
      notify.success("Review removed.");
      await load();
    } catch (err) {
      notify.fromError(err, "Could not delete review.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="rh">
      <section className="rh-hero">
        <div>
          <p className="rh-eyebrow">
            {scope === "vendor" ? "Store trust" : "Trust"}
          </p>
          <h2>Reviews</h2>
          <p>
            {scope === "vendor"
              ? "Moderate ratings and photo reviews on your products. Search, filter by stars, and remove spam."
              : "Moderate marketplace product reviews across vendors. Find low ratings, photo reviews, and remove spam."}
          </p>
        </div>
        <div className="rh-hero__score">
          <span>Avg rating</span>
          <strong>{stats.avg ? stats.avg.toFixed(1) : "—"}</strong>
          <small>
            <i className="fa-solid fa-star" />{" "}
            {stats.count} review{stats.count === 1 ? "" : "s"}
          </small>
        </div>
      </section>

      <section className="rh-kpis">
        <div className="rh-kpi">
          <span className="rh-kpi__icon" aria-hidden="true">
            <i className="fa-solid fa-comments" />
          </span>
          <span>In view</span>
          <strong>{stats.count}</strong>
          <small>
            {selectedProduct || ratingFilter !== "all" || photoFilter !== "all" || query
              ? "After filters"
              : `${reviews.length} total loaded`}
          </small>
        </div>
        <div className="rh-kpi">
          <span className="rh-kpi__icon" aria-hidden="true">
            <i className="fa-solid fa-camera" />
          </span>
          <span>With photos</span>
          <strong>{stats.withPhotos}</strong>
          <small>
            {stats.count
              ? `${Math.round((stats.withPhotos / stats.count) * 100)}% of view`
              : "No reviews"}
          </small>
        </div>
        <div className="rh-kpi">
          <span className="rh-kpi__icon" aria-hidden="true">
            <i className="fa-solid fa-face-frown" />
          </span>
          <span>Low ratings</span>
          <strong>{stats.low}</strong>
          <small>1–2 stars · needs attention</small>
        </div>
        <div className="rh-kpi">
          <span className="rh-kpi__icon" aria-hidden="true">
            <i className="fa-solid fa-chart-simple" />
          </span>
          <span>Distribution</span>
          <div className="rh-dist" style={{ marginTop: "0.35rem" }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const n = stats.dist[star] || 0;
              const pct = stats.count ? Math.round((n / stats.count) * 100) : 0;
              return (
                <div className="rh-dist__row" key={star}>
                  <span>{star}</span>
                  <span className="rh-dist__track">
                    <span
                      className="rh-dist__fill"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rh-toolbar">
        <label className="rh-field rh-field--grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Product, customer, comment…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="rh-field">
          <span>Product</span>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">All products</option>
            {productOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="rh-field">
          <span>Photos</span>
          <select
            value={photoFilter}
            onChange={(e) => setPhotoFilter(e.target.value)}
          >
            <option value="all">Any</option>
            <option value="photos">With photos</option>
            <option value="text">Text only</option>
          </select>
        </label>
        <div className="rh-field">
          <span>Rating</span>
          <div className="rh-rating-pills" role="group" aria-label="Filter by rating">
            <button
              type="button"
              className={`rh-rating-pill${ratingFilter === "all" ? " is-active" : ""}`}
              onClick={() => setRatingFilter("all")}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                type="button"
                className={`rh-rating-pill${
                  ratingFilter === String(n) ? " is-active" : ""
                }`}
                onClick={() => setRatingFilter(String(n))}
              >
                {n}★
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rh-panel">
        <div className="rh-panel__head">
          <div>
            <h3>Review queue</h3>
            <p>
              {loading
                ? "Loading…"
                : `Showing ${from}–${to} of ${totalItems} matching review${
                    totalItems === 1 ? "" : "s"
                  }`}
            </p>
          </div>
        </div>

        <div className="rh-table-wrap">
          <table className="rh-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Photos</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                pageItems.map((review) => {
                  const { name, email } = customerLabel(review.customer);
                  const comment = review.comment || "";
                  const long = comment.length > 140;
                  const open = expanded.has(review._id);
                  return (
                    <tr key={review._id}>
                      <td>
                        <div className="rh-product">
                          {review.product?._id ? (
                            <Link to={`/customer/products/${review.product._id}`}>
                              {review.product.name}
                            </Link>
                          ) : (
                            <strong>—</strong>
                          )}
                          {review.product?.averageRating != null ? (
                            <small>
                              Product avg {Number(review.product.averageRating).toFixed(1)} ·{" "}
                              {review.product.totalReviews || 0} total
                            </small>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="rh-customer">
                          <strong>{name}</strong>
                          {email ? <span>{email}</span> : null}
                        </div>
                      </td>
                      <td>
                        <Stars rating={review.rating} />
                      </td>
                      <td>
                        <div
                          className={`rh-comment${open ? " is-open" : ""}`}
                        >
                          {review.title ? <strong>{review.title}</strong> : null}
                          <p>{comment || "—"}</p>
                          {long ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(review._id)}
                            >
                              {open ? "Show less" : "Show more"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="rh-photos">
                          {(review.images || []).slice(0, 3).map((img) => (
                            <a
                              key={img.public_id || img.url}
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open photo"
                            >
                              <img src={img.url} alt="" />
                            </a>
                          ))}
                          {!review.images?.length ? (
                            <span className="muted">—</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="panel-btn danger"
                          disabled={removingId === review._id}
                          onClick={() => handleDelete(review._id)}
                        >
                          {removingId === review._id ? "…" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="rh-empty">
                      {reviews.length === 0
                        ? "No reviews yet. Customers can rate products from the product page."
                        : "No reviews match these filters."}
                    </div>
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="rh-empty">Loading reviews…</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

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

export default ReviewsHub;
