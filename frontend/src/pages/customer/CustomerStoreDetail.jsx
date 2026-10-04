import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { productApi, storeApi, unwrapList } from "../../api/services";
import ProductCard from "../../components/shop/ProductCard";
import {
  ProductGridSkeleton,
  StoreGridSkeleton,
} from "../../components/shop/LoadingStates";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";

const CustomerStoreDetail = () => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [storeRes, productsRes] = await Promise.all([
          storeApi.getById(id),
          productApi.list({ store: id, status: "active", page: 1, limit: 48 }),
        ]);
        if (!active) return;
        setStore(storeRes.data.data || storeRes.data);
        setProducts(unwrapList(productsRes.data).data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(products, {
    pageSize: 12,
    resetKey: id,
  });

  if (loading) {
    return (
      <>
        <StoreGridSkeleton count={1} />
        <ProductGridSkeleton count={8} />
      </>
    );
  }
  if (!store) return <p className="shop-muted">Store not found.</p>;

  return (
    <>
      <section className="shop-banner" style={{ minHeight: 180, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "2rem" }}>{store.storeName}</h1>
          <p>{store.description || "Shop products from this store."}</p>
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-section-head">
          <h2>Products from {store.storeName}</h2>
        </div>
        {products.length ? (
          <>
            <div className="shop-product-grid">
              {pageItems.map((product) => (
                <ProductCard key={product._id} product={product} storeId={id} />
              ))}
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
          </>
        ) : (
          <div className="shop-empty" style={{ boxShadow: "none" }}>
            <h2>No products in this store</h2>
            <p>Check back later for new arrivals.</p>
          </div>
        )}
      </section>
    </>
  );
};

export default CustomerStoreDetail;
