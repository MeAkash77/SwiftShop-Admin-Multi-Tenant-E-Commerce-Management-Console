const Pagination = ({
  page,
  totalPages,
  totalItems,
  from,
  to,
  onPageChange,
  variant = "panel",
}) => {
  if (!totalItems) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const className = variant === "shop" ? "shop-pagination" : "panel-pagination";

  return (
    <div className={className} role="navigation" aria-label="Pagination">
      <span className={`${className}__meta`}>
        Showing {from}–{to} of {totalItems}
      </span>
      <div className={`${className}__controls`}>
        <button
          type="button"
          className={variant === "shop" ? "shop-btn shop-btn-ghost" : "panel-btn secondary"}
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className={`${className}__page`}>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={variant === "shop" ? "shop-btn shop-btn-ghost" : "panel-btn secondary"}
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
