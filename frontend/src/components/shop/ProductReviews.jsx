import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { reviewApi } from "../../api/services";
import { useRequireCustomerAuth } from "../../hooks/useRequireCustomerAuth";
import { notify } from "../../utils/notify";

const RATING_HINT = {
  1: "Poor",
  2: "Fair",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

function Stars({ value, onChange, size = "1rem" }) {
  return (
    <div className="shop-stars" style={{ fontSize: size }} role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? "is-on" : ""}
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={onChange ? n <= value : undefined}
        >
          <i className="fa-solid fa-star" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function customerIdOf(review) {
  return String(review.customer?._id || review.customer || "");
}

function formatReviewDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ProductReviews = ({ productId, onStatsChange, embedded = false }) => {
  const location = useLocation();
  const user = useSelector((state) => state.user.user);
  const { isCustomer, requireAuth } = useRequireCustomerAuth();
  const myId = String(user?.id || user?._id || "");

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  async function load() {
    setLoading(true);
    try {
      const res = await reviewApi.byProduct(productId);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (productId) {
      setEditing(false);
      setImages([]);
      setRemoveImageIds([]);
      load();
    }
  }, [productId]);

  const mine = useMemo(
    () => (myId ? reviews.find((r) => customerIdOf(r) === myId) : null),
    [reviews, myId]
  );

  useEffect(() => {
    if (mine && editing) {
      setRating(mine.rating || 5);
      setTitle(mine.title || "");
      setComment(mine.comment || "");
      setImages([]);
      setRemoveImageIds([]);
    }
  }, [mine, editing]);

  const breakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) counts[r.rating] = (counts[r.rating] || 0) + 1;
    return counts;
  }, [reviews]);

  const avg =
    reviews.length === 0
      ? 0
      : Math.round(
          (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length) * 10
        ) / 10;

  const hasReviews = reviews.length > 0;

  function resetForm() {
    setTitle("");
    setComment("");
    setImages([]);
    setRemoveImageIds([]);
    setRating(5);
    setEditing(false);
  }

  function onPickImages(fileList, max = 4) {
    setImages(Array.from(fileList || []).slice(0, max));
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!requireAuth("Please login as a customer to write a review.")) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("rating", String(rating));
      formData.append("title", title);
      formData.append("comment", comment);
      images.slice(0, 4).forEach((file) => formData.append("images", file));

      const res = await reviewApi.create(formData);
      notify.success("Review posted. Thank you!");
      resetForm();
      await load();
      onStatsChange?.({
        averageRating: res.data?.averageRating,
        totalReviews: res.data?.totalReviews,
      });
    } catch (err) {
      notify.fromError(err, "Could not post review.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!mine?._id) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rating", String(rating));
      formData.append("title", title);
      formData.append("comment", comment);
      if (removeImageIds.length) {
        formData.append("removeImages", JSON.stringify(removeImageIds));
      }
      images.slice(0, 4).forEach((file) => formData.append("images", file));

      const res = await reviewApi.update(mine._id, formData);
      notify.success("Your review was updated.");
      resetForm();
      await load();
      onStatsChange?.({
        averageRating: res.data?.averageRating,
        totalReviews: res.data?.totalReviews,
      });
    } catch (err) {
      notify.fromError(err, "Could not update review.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId) {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      const res = await reviewApi.remove(reviewId);
      notify.success("Review deleted.");
      resetForm();
      await load();
      onStatsChange?.({
        averageRating: res.data?.averageRating,
        totalReviews: res.data?.totalReviews,
      });
    } catch (err) {
      notify.fromError(err, "Could not delete review.");
    }
  }

  function toggleRemoveExisting(publicId) {
    setRemoveImageIds((prev) =>
      prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId]
    );
  }

  const keptExisting =
    editing && mine
      ? (mine.images || []).filter((img) => !removeImageIds.includes(img.public_id))
      : [];

  const slotsLeft = Math.max(0, 4 - keptExisting.length);

  function renderForm({ onSubmit, heading, submitLabel, busyLabel, showCancel }) {
    return (
      <form className="shop-review-form" onSubmit={onSubmit}>
        <div className="shop-review-form-head">
          <h3>{heading}</h3>
          <p>Your rating helps other shoppers decide.</p>
        </div>

        <div className="shop-review-rate">
          <span className="shop-review-label">Your rating</span>
          <div className="shop-review-rate-row">
            <Stars value={rating} onChange={setRating} size="1.35rem" />
            <em>{RATING_HINT[rating] || ""}</em>
          </div>
        </div>

        <label className="shop-review-field">
          <span className="shop-review-label">
            Title <small>(optional)</small>
          </span>
          <input
            type="text"
            placeholder="Sum up your experience in a few words"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </label>

        <label className="shop-review-field">
          <span className="shop-review-label">Review</span>
          <textarea
            placeholder="What did you like or dislike? Quality, delivery, value…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            required
            maxLength={2000}
          />
        </label>

        {editing && mine?.images?.length ? (
          <div className="shop-review-field">
            <span className="shop-review-label">Current photos</span>
            <div className="shop-review-photos shop-review-photos--edit">
              {mine.images.map((img) => {
                const marked = removeImageIds.includes(img.public_id);
                return (
                  <button
                    key={img.public_id || img.url}
                    type="button"
                    className={marked ? "is-removed" : ""}
                    onClick={() => toggleRemoveExisting(img.public_id)}
                    title={marked ? "Undo remove" : "Remove photo"}
                  >
                    <img src={img.url} alt="Review" />
                    <span>{marked ? "Undo" : "Remove"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="shop-review-field">
          <span className="shop-review-label">
            Photos <small>(optional, up to {editing ? slotsLeft : 4})</small>
          </span>
          <label className="shop-review-drop">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPickImages(e.target.files, editing ? slotsLeft : 4)}
            />
            <i className="fa-solid fa-camera" aria-hidden="true" />
            <strong>Add photos</strong>
            <span>JPG or PNG · max 4 images</span>
          </label>
          {imagePreviews.length ? (
            <div className="shop-review-photos shop-review-photos--preview">
              {imagePreviews.map((p) => (
                <div key={p.url} className="shop-review-preview">
                  <img src={p.url} alt="" />
                </div>
              ))}
              <button
                type="button"
                className="shop-review-clear-photos"
                onClick={() => setImages([])}
              >
                Clear photos
              </button>
            </div>
          ) : null}
        </div>

        <div className="shop-review-form-actions">
          <button className="shop-btn shop-btn-primary" type="submit" disabled={submitting}>
            {submitting ? busyLabel : submitLabel}
          </button>
          {showCancel ? (
            <button
              className="shop-btn shop-btn-ghost"
              type="button"
              onClick={() => {
                setEditing(false);
                setImages([]);
                setRemoveImageIds([]);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <section className={`shop-reviews ${embedded ? "is-embedded" : ""}`} id="reviews">
      {!embedded ? (
        <div className="shop-section-head">
          <h2>Ratings &amp; Reviews</h2>
        </div>
      ) : null}

      {hasReviews ? (
        <div className="shop-reviews-summary">
          <div className="shop-reviews-score">
            <strong>{avg.toFixed(1)}</strong>
            <Stars value={Math.round(avg)} />
            <span className="shop-muted">
              Based on {reviews.length} rating{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="shop-reviews-bars">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = breakdown[n] || 0;
              const pct = Math.round((count / reviews.length) * 100);
              return (
                <div key={n} className="shop-reviews-bar-row">
                  <span>{n}★</span>
                  <div className="shop-reviews-bar" aria-hidden="true">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <em>{count}</em>
                </div>
              );
            })}
          </div>
        </div>
      ) : !loading ? (
        <div className="shop-reviews-empty">
          <div className="shop-reviews-empty-icon" aria-hidden="true">
            <i className="fa-solid fa-star" />
          </div>
          <div>
            <h3>No reviews yet</h3>
            <p>
              {isCustomer && !mine
                ? "Be the first to rate this product and help other shoppers."
                : isCustomer
                  ? "Ratings will appear here after customers leave a review."
                  : "Login to be the first to rate this product."}
            </p>
          </div>
        </div>
      ) : null}

      {isCustomer && !mine
        ? renderForm({
            onSubmit: handleCreate,
            heading: "Write a review",
            submitLabel: "Submit review",
            busyLabel: "Posting…",
            showCancel: false,
          })
        : null}

      {isCustomer && mine && editing
        ? renderForm({
            onSubmit: handleUpdate,
            heading: "Edit your review",
            submitLabel: "Save changes",
            busyLabel: "Saving…",
            showCancel: true,
          })
        : null}

      {!isCustomer ? (
        <div className="shop-reviews-login">
          <div className="shop-reviews-login-copy">
            <p>Want to rate this product?</p>
            <span>Login to share your experience with other shoppers.</span>
          </div>
          <Link
            className="shop-btn shop-btn-primary"
            to="/login"
            state={{ from: location }}
          >
            Login to write a review
          </Link>
        </div>
      ) : null}

      {loading ? <p className="shop-muted shop-reviews-loading">Loading reviews…</p> : null}

      {hasReviews ? (
        <div className="shop-review-list">
          <h3 className="shop-review-list-title">
            Customer reviews <span>({reviews.length})</span>
          </h3>
          {reviews.map((review) => {
            const isMine = myId && customerIdOf(review) === myId;
            return (
              <article
                key={review._id}
                className={`shop-review-card ${isMine ? "is-mine" : ""}`}
              >
                <div className="shop-review-card-head">
                  <span className="shop-rating">
                    <i className="fa-solid fa-star" aria-hidden="true" /> {review.rating}
                  </span>
                  <strong>
                    {[review.customer?.firstName, review.customer?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      review.customer?.name ||
                      "Customer"}
                    {isMine ? <em className="shop-review-you"> · You</em> : null}
                  </strong>
                  <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
                </div>
                {review.title ? <h4>{review.title}</h4> : null}
                {review.comment ? <p>{review.comment}</p> : null}
                {review.images?.length ? (
                  <div className="shop-review-photos">
                    {review.images.map((img) => (
                      <a
                        key={img.public_id || img.url}
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img src={img.url} alt="Review" />
                      </a>
                    ))}
                  </div>
                ) : null}
                {isCustomer && isMine && !editing ? (
                  <div className="shop-review-card-actions">
                    <button
                      type="button"
                      className="shop-btn shop-btn-outline"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="shop-btn shop-btn-ghost"
                      onClick={() => handleDelete(review._id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default ProductReviews;
