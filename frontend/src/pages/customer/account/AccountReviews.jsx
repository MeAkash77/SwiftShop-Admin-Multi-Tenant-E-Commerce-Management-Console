import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import usePagination from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import { reviewApi } from "../../../api/services";
import { notify } from "../../../utils/notify";

const AccountReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await reviewApi.mine();
        if (!cancelled) setReviews(res.data?.reviews || []);
      } catch (err) {
        if (!cancelled) {
          setReviews([]);
          notify.fromError(err, "Could not load your reviews.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(
    reviews,
    { pageSize: 8 }
  );

  if (loading) {
    return (
      <div className="fk-panel">
        <div className="fk-panel-head">
          <h1>My Reviews & Ratings</h1>
        </div>
        <p>Loading…</p>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="fk-panel fk-empty-panel">
        <i className="fa-solid fa-star" aria-hidden="true" />
        <h1>No reviews yet</h1>
        <p>Rate products from delivered orders to see them here.</p>
        <Link className="shop-btn shop-btn-primary" to="/customer/products">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="fk-panel">
      <div className="fk-panel-head">
        <h1>My Reviews & Ratings</h1>
      </div>
      <div className="fk-notify-list">
        {pageItems.map((review) => {
          const product = review.product;
          const productId = product?._id || product;
          const image = product?.images?.[0]?.url;
          return (
            <div className="fk-notify-item" key={review._id}>
              <div className="fk-notify-icon" style={{ overflow: "hidden" }}>
                {image ? (
                  <img
                    src={image}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <i className="fa-solid fa-star" aria-hidden="true" />
                )}
              </div>
              <div>
                <h3>
                  {productId ? (
                    <Link to={`/customer/products/${productId}`}>
                      {product?.name || "Product"}
                    </Link>
                  ) : (
                    product?.name || "Product"
                  )}
                </h3>
                <p>
                  {"★".repeat(review.rating || 0)}
                  {"☆".repeat(Math.max(0, 5 - (review.rating || 0)))}{" "}
                  {review.comment || review.title || ""}
                </p>
                <span>
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-IN")
                    : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        variant="shop"
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

export default AccountReviews;
