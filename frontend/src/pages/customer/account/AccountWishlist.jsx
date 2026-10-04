import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "../../../features/wishlist/wishlistSlice";
import { addToCart } from "../../../features/cart/cartSlice";
import usePagination from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";

const AccountWishlist = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.wishlist.items);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(items, {
    pageSize: 8,
  });

  if (!items.length) {
    return (
      <div className="fk-panel fk-empty-panel">
        <i className="fa-regular fa-heart" aria-hidden="true" />
        <h1>Empty Wishlist</h1>
        <p>You have no items in your wishlist. Start adding!</p>
        <Link className="shop-btn shop-btn-primary" to="/customer/products">
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="fk-panel">
      <div className="fk-panel-head">
        <h1>My Wishlist ({items.length})</h1>
        <p className="muted" style={{ margin: 0 }}>
          Saved on this device only — not synced to your account.
        </p>
      </div>
      <div className="fk-wishlist-grid">
        {pageItems.map((item) => (
          <div className="fk-wishlist-card" key={item.productId}>
            <button
              type="button"
              className="fk-wish-remove"
              onClick={() => dispatch(removeFromWishlist(item.productId))}
              aria-label="Remove from wishlist"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
            <Link to={`/customer/products/${item.productId}`}>
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="shop-product-placeholder">No image</div>
              )}
              <h3>{item.name}</h3>
              <p className="shop-price">₹{item.price}</p>
            </Link>
            <button
              type="button"
              className="shop-btn shop-btn-primary"
              onClick={() =>
                dispatch(
                  addToCart({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    storeId: item.storeId,
                    image: item.image,
                    stock: 99,
                  })
                )
              }
            >
              ADD TO CART
            </button>
          </div>
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
    </div>
  );
};

export default AccountWishlist;
