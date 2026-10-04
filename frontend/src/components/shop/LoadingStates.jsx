function SkeletonBlock({ className = "" }) {
  return <span className={`shop-skeleton ${className}`} aria-hidden="true" />;
}

export function ProductGridSkeleton({ count = 8, rail = false }) {
  const cards = Array.from({ length: count }).map((_, index) => (
    <article className="shop-product-skeleton-card" key={index}>
      <SkeletonBlock className="shop-product-skeleton-media" />
      <SkeletonBlock className="shop-product-skeleton-title" />
      <SkeletonBlock className="shop-product-skeleton-title short" />
      <div className="shop-product-skeleton-meta">
        <SkeletonBlock className="shop-product-skeleton-pill" />
        <SkeletonBlock className="shop-product-skeleton-price" />
      </div>
      <SkeletonBlock className="shop-product-skeleton-button" />
    </article>
  ));

  if (rail) {
    return (
      <div className="shop-product-rail shop-skeleton-rail" aria-label="Loading products">
        {cards}
      </div>
    );
  }

  return (
    <section className="shop-section" aria-label="Loading products">
      <div className="shop-product-grid">{cards}</div>
    </section>
  );
}

export function StoreGridSkeleton({ count = 6 }) {
  return (
    <section className="shop-section" aria-label="Loading stores">
      <div className="shop-store-strip">
        {Array.from({ length: count }).map((_, index) => (
          <article className="shop-store-skeleton-card" key={index}>
            <SkeletonBlock className="shop-store-skeleton-icon" />
            <div>
              <SkeletonBlock className="shop-store-skeleton-title" />
              <SkeletonBlock className="shop-store-skeleton-line" />
              <SkeletonBlock className="shop-store-skeleton-line short" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OrderListSkeleton({ count = 4 }) {
  return (
    <div className="shop-order-skeleton-list" aria-label="Loading orders">
      {Array.from({ length: count }).map((_, index) => (
        <article className="shop-order-skeleton-card" key={index}>
          <div className="shop-order-skeleton-top">
            <SkeletonBlock className="shop-order-skeleton-title" />
            <SkeletonBlock className="shop-order-skeleton-pill" />
          </div>
          <SkeletonBlock className="shop-order-skeleton-line" />
          <SkeletonBlock className="shop-order-skeleton-line short" />
          <div className="shop-order-skeleton-actions">
            <SkeletonBlock className="shop-order-skeleton-button" />
            <SkeletonBlock className="shop-order-skeleton-button" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function PageLoader({
  label = "Preparing your marketplace",
  compact = false,
}) {
  return (
    <div
      className={`shop-page-loader${compact ? " shop-page-loader--compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="shop-page-loader-card">
        <span className="shop-page-loader-logo">M</span>
        <div>
          <strong>{label}</strong>
          <p>
            {compact
              ? "Almost ready — keeping your browse experience smooth."
              : "Loading fresh products and secure account details..."}
          </p>
        </div>
      </div>
    </div>
  );
}
