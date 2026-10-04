import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storeApi } from "../../api/services";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import { StoreGridSkeleton } from "../../components/shop/LoadingStates";

const CustomerStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi
      .list()
      .then((res) => setStores(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(stores, {
    pageSize: 9,
  });

  return (
    <>
      <h1 className="shop-page-title">All Stores</h1>
      <p className="shop-muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Explore vendor stores and shop their catalogs.
      </p>

      {loading ? (
        <StoreGridSkeleton count={6} />
      ) : stores.length ? (
        <section className="shop-section">
          <div className="shop-store-strip">
            {pageItems.map((store) => (
              <Link
                className="shop-store-card"
                key={store._id}
                to={`/customer/stores/${store._id}`}
              >
                <h3>{store.storeName}</h3>
                <p>{store.description || "Visit this store"}</p>
                {store.address ? (
                  <p className="shop-muted" style={{ marginTop: 8 }}>
                    {store.address}
                  </p>
                ) : null}
              </Link>
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
        </section>
      ) : (
        <div className="shop-empty">
          <h2>No stores available</h2>
          <p>Vendors can create stores from the vendor panel.</p>
        </div>
      )}
    </>
  );
};

export default CustomerStores;
