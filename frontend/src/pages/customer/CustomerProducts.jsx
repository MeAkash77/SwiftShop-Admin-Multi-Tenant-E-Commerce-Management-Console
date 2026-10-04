import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { categoryApi, productApi, unwrapList } from "../../api/services";
import ProductCard from "../../components/shop/ProductCard";
import { RecentlyViewedRail } from "../../components/shop/EngagementBlocks";
import { ProductGridSkeleton } from "../../components/shop/LoadingStates";
import Pagination from "../../components/Pagination";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import {
  readShopCache,
  writeShopCache,
  SHOP_CACHE_KEYS,
} from "../../utils/shopBootstrapCache";

const PAGE_SIZE = 12;

const CustomerProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const cacheKey = SHOP_CACHE_KEYS.products(searchParams.toString() || "all");
  const cached = readShopCache(cacheKey);
  const [keyword, setKeyword] = useState(initialQ);
  const [products, setProducts] = useState(() => cached?.data || []);
  const [categoryName, setCategoryName] = useState(() => cached?.categoryName || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [loading, setLoading] = useState(() => !(cached?.data?.length > 0));
  const [recent, setRecent] = useState([]);
  const [totalItems, setTotalItems] = useState(() => cached?.total || 0);
  const [totalPages, setTotalPages] = useState(() => cached?.totalPages || 1);
  const [page, setPage] = useState(pageParam);

  useEffect(() => {
    setRecent(getRecentlyViewed());
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function load() {
      const q = searchParams.get("q") || "";
      const category = searchParams.get("category") || "";
      const nextPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
      const nextSort = searchParams.get("sort") || "relevance";
      const key = SHOP_CACHE_KEYS.products(searchParams.toString() || "all");
      const warm = readShopCache(key);
      setKeyword(q);
      setPage(nextPage);
      setSort(nextSort);
      if (warm?.data?.length) {
        setProducts(warm.data);
        setTotalItems(warm.total || warm.data.length);
        setTotalPages(Math.max(1, warm.totalPages || 1));
        setCategoryName(warm.categoryName || "");
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        if (category) {
          const catRes = await categoryApi.getBySlug(category);
          if (active) setCategoryName(catRes.data?.data?.name || category);
        } else if (active) {
          setCategoryName("");
        }

        let meta;
        if (q.trim()) {
          const response = await productApi.search(q.trim(), {
            page: nextPage,
            limit: PAGE_SIZE,
            category: category || undefined,
          });
          meta = unwrapList(response.data);
        } else {
          const params = {
            status: "active",
            page: nextPage,
            limit: PAGE_SIZE,
            sort: nextSort === "relevance" ? "newest" : nextSort,
          };
          if (category) params.category = category;
          const response = await productApi.list(params);
          meta = unwrapList(response.data);
        }

        if (active) {
          setProducts(meta.data);
          setTotalItems(meta.total);
          setTotalPages(Math.max(1, meta.totalPages || 1));
          writeShopCache(key, {
            data: meta.data,
            total: meta.total,
            totalPages: meta.totalPages,
            categoryName: category || undefined,
          });
        }
      } catch (err) {
        console.error(err);
        if (active && !(warm?.data?.length > 0)) {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [searchParams]);

  function updateParams(patch) {
    const next = {
      ...(searchParams.get("q") ? { q: searchParams.get("q") } : {}),
      ...(searchParams.get("category")
        ? { category: searchParams.get("category") }
        : {}),
      ...(searchParams.get("sort") ? { sort: searchParams.get("sort") } : {}),
      ...patch,
    };
    if (!next.page || String(next.page) === "1") delete next.page;
    if (!next.sort || next.sort === "relevance") delete next.sort;
    setSearchParams(next);
  }

  const title = keyword
    ? `Results for “${keyword}”`
    : categoryName
      ? categoryName
      : "All Products";

  const from = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <>
      <div className="cx-welcome" style={{ marginBottom: "1rem" }}>
        <div>
          <strong>{title}</strong>
          <p>
            {loading
              ? "Finding great picks…"
              : `${totalItems} product${totalItems === 1 ? "" : "s"} · sort by deals, price, or rating`}
          </p>
        </div>
        <Link className="shop-btn shop-btn-outline" to="/customer">
          Back to home
        </Link>
      </div>

      <form
        className="shop-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({
            q: keyword.trim() || undefined,
            category: categorySlug || undefined,
            sort: sort !== "relevance" ? sort : undefined,
            page: undefined,
          });
        }}
      >
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search products, brands and more"
        />
        <select
          value={sort}
          onChange={(e) => {
            const value = e.target.value;
            setSort(value);
            updateParams({
              sort: value !== "relevance" ? value : undefined,
              page: undefined,
            });
          }}
        >
          <option value="relevance">Relevance</option>
          <option value="discount">Biggest discount</option>
          <option value="rating">Top rated</option>
          <option value="price-asc">Price — Low to High</option>
          <option value="price-desc">Price — High to Low</option>
        </select>
        <button className="shop-btn shop-btn-primary" type="submit">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Search
        </button>
      </form>

      {!keyword && !categorySlug ? <RecentlyViewedRail items={recent} /> : null}

      {loading ? (
        <ProductGridSkeleton count={PAGE_SIZE} />
      ) : products.length ? (
        <section className="shop-section">
          <div className="shop-product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <Pagination
            variant="shop"
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            from={from}
            to={to}
            onPageChange={(next) => updateParams({ page: next > 1 ? String(next) : undefined })}
          />
        </section>
      ) : (
        <div className="shop-empty">
          <h2>No products found</h2>
          <p>Try another keyword, or jump back to deals you already liked.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="shop-btn shop-btn-primary"
              onClick={() => {
                setKeyword("");
                setSearchParams({});
              }}
            >
              Clear filters
            </button>
            <Link className="shop-btn shop-btn-outline" to="/customer">
              Home deals
            </Link>
          </div>
          <RecentlyViewedRail items={recent} />
        </div>
      )}
    </>
  );
};

export default CustomerProducts;
