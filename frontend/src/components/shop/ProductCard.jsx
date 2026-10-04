import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../features/cart/cartSlice";
import { toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { useRequireCustomerAuth } from "../../hooks/useRequireCustomerAuth";
import { getProductPricing, getProductRating } from "../../utils/productDisplay";
import StableProductImage from "./StableProductImage";

const ProductCard = ({ product, storeId, highlightDeal = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCustomer, requireAuth } = useRequireCustomerAuth();
  const wished = useSelector((state) =>
    state.wishlist.items.some((item) => item.productId === product._id)
  );
  const image = product.images?.[0]?.url;
  const { price, mrp, offer } = getProductPricing(product);
  const { average, total } = getProductRating(product);

  function handleAdd(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!requireAuth("Please login to add items to your cart.")) return;
    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price,
        storeId: storeId || product.store?._id || product.store,
        stock: product.stock,
        image: image || null,
      })
    );
  }

  function handleWish(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!requireAuth("Please login to save items to your wishlist.")) return;
    dispatch(
      toggleWishlist({
        productId: product._id,
        name: product.name,
        price,
        image: image || null,
        storeId: storeId || product.store?._id || product.store,
      })
    );
  }

  function handleLoginToBuy(event) {
    event.preventDefault();
    event.stopPropagation();
    navigate("/login", { state: { from: location } });
  }

  return (
    <Link
      className={`shop-product-card relative bg-white border border-fk-border rounded-[10px] p-3.5 no-underline text-inherit transition-[box-shadow,border-color,transform] duration-200 flex flex-col min-h-[320px] hover:shadow-fk-lg hover:border-fk-blue hover:-translate-y-0.5 ${
        highlightDeal ? "shop-product-card--deal" : ""
      }`}
      to={`/customer/products/${product._id}`}
    >
      {highlightDeal && offer ? (
        <span className="shop-product-card-badge shop-product-card-badge--deal">
          Deal
        </span>
      ) : offer ? (
        <span className="shop-product-card-badge">{offer}% off</span>
      ) : null}

      {isCustomer ? (
        <button
          type="button"
          className={`absolute top-2.5 right-2.5 z-[2] w-8 h-8 border border-fk-border rounded-[8px] bg-white cursor-pointer ${
            wished ? "text-cx-danger" : "text-fk-muted hover:text-cx-danger"
          }`}
          onClick={handleWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <i className={`${wished ? "fa-solid" : "fa-regular"} fa-heart`} aria-hidden="true" />
        </button>
      ) : null}

      <StableProductImage
        src={image}
        alt={product.name}
        className="shop-product-card-media mb-3"
      />

      <h3 className="m-0 mb-2 text-[0.92rem] font-medium leading-snug line-clamp-2 min-h-[2.5em] text-fk-text">
        {product.name}
      </h3>
      <span className="shop-rating">
        <i className="fa-solid fa-star" aria-hidden="true" />{" "}
        {average ? average.toFixed(1) : "New"}
        {total ? <em className="shop-rating-count">({total})</em> : null}
      </span>
      <p className="shop-price">
        {mrp > price ? <span className="shop-mrp">₹{mrp}</span> : null}
        <span className="shop-price-now">₹{price}</span>
      </p>
      {offer ? <p className="shop-offer">{offer}% off</p> : null}
      <div className="mt-auto flex gap-2 pt-2.5">
        {isCustomer ? (
          <button
            type="button"
            className="shop-btn shop-btn-primary flex-1 py-2.5 px-2 text-[0.78rem]"
            onClick={handleAdd}
          >
            Add to cart
          </button>
        ) : (
          <button
            type="button"
            className="shop-btn shop-btn-outline flex-1 py-2.5 px-2 text-[0.78rem]"
            onClick={handleLoginToBuy}
          >
            Login to buy
          </button>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
