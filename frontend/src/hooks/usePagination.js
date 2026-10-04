import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination for list/table pages.
 * Pass resetKey (e.g. filter string) to jump back to page 1 when filters change.
 */
export default function usePagination(items = [], { pageSize = 10, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const list = Array.isArray(items) ? items : [];

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, safePage, pageSize]);

  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    from: totalItems === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, totalItems),
  };
}
