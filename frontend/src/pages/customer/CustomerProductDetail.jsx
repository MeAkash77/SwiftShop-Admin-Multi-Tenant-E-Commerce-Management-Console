import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { productApi, storeApi, unwrapList } from "../../api/services";
import ProductCard from "../../components/shop/ProductCard";
import ProductReviews from "../../components/shop/ProductReviews";
import { addToCart } from "../../features/cart/cartSlice";
import { toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { useRequireCustomerAuth } from "../../hooks/useRequireCustomerAuth";
import { getProductRating, getVariantPricing } from "../../utils/productDisplay";
import { findMatchingVariant } from "../../utils/productTypeTemplates";
import { sanitizeProductHtml } from "../../utils/sanitizeHtml";
import { notify } from "../../utils/notify";
import { pushRecentlyViewed } from "../../utils/recentlyViewed";
import StableProductImage, { uniqueImageList } from "../../components/shop/StableProductImage";

const TABS = [
  { id: "about", label: "Highlights" },
  { id: "description", label: "Description" },
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
];

const CustomerProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCustomer, requireAuth } = useRequireCustomerAuth();
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lens, setLens] = useState({ show: false, x: 50, y: 50 });
  const [selected, setSelected] = useState({});
  const [tab, setTab] = useState("about");
  const [addedFlash, setAddedFlash] = useState(false);
  const wished = useSelector((state) =>
    state.wishlist.items.some((item) => item.productId === id)
  );

  const productStoreId = product?.store?._id || product?.store || null;

  useEffect(() => {
    if (!productStoreId) return undefined;
    let active = true;
    storeApi
      .getById(productStoreId)
      .then((res) => {
        if (active) setStoreInfo(res.data?.data || res.data || null);
      })
      .catch(() => {
        if (active) setStoreInfo(null);
      });
    return () => {
      active = false;
    };
  }, [productStoreId]);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setStoreInfo(null);
    setRelated([]);
    setActiveImage(0);
    setSelected({});
    setLoading(true);
    setTab("about");
    window.scrollTo({ top: 0, behavior: "smooth" });

    async function load() {
      try {
        const res = await productApi.getById(id);
        if (!active) return;
        const data = res.data?.data || res.data?.product || res.data;
        setProduct(data);
        pushRecentlyViewed(data);
        setActiveImage(0);

        const initial = {};
        for (const group of data.optionGroups || []) {
          if (group.values?.length) initial[group.key] = group.values[0];
        }
        setSelected(initial);

        const hasAbout = data.aboutItems?.length;
        const hasDesc =
          data.description &&
          sanitizeProductHtml(data.description) &&
          sanitizeProductHtml(data.description) !== "<br>";
        const hasSpecs = data.specifications?.length;
        if (!hasAbout && hasDesc) setTab("description");
        else if (!hasAbout && !hasDesc && hasSpecs) setTab("specs");
        else if (!hasAbout && !hasDesc && !hasSpecs) setTab("reviews");

        const categoryId = data?.category?._id || data?.category;
        const storeIdVal = data?.store?._id || data?.store;
        const listRes = await productApi.list({
          status: "active",
          category: data?.category?.slug || categoryId || undefined,
          page: 1,
          limit: 12,
        });
        if (!active) return;
        const all = unwrapList(listRes.data).data;

        const others = all.filter((p) => String(p._id) !== String(data._id));
        const sameCategory = others.filter((p) => {
          const c = p.category?._id || p.category;
          return categoryId && String(c) === String(categoryId);
        });
        const sameStore = others.filter((p) => {
          const s = p.store?._id || p.store;
          return storeIdVal && String(s) === String(storeIdVal);
        });

        const picked = [];
        const seen = new Set();
        for (const pool of [sameCategory, sameStore, others]) {
          for (const p of pool) {
            if (seen.has(p._id)) continue;
            seen.add(p._id);
            picked.push(p);
            if (picked.length >= 8) break;
          }
          if (picked.length >= 8) break;
        }
        setRelated(picked);
      } catch (err) {
        console.error(err);
        notify.fromError(err, "Could not load product.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const images = useMemo(
    () => uniqueImageList(product?.images || []),
    [product]
  );

  const matchedVariant = useMemo(
    () => findMatchingVariant(product?.variants || [], selected),
    [product, selected]
  );

  const availableStock = matchedVariant
    ? Number(matchedVariant.stock) || 0
    : Number(product?.stock) || 0;

  if (loading) {
    return (
      <div className="pdp-page">
        <div className="pdp-skeleton" aria-busy="true" aria-label="Loading product">
          <div className="pdp-skeleton-gallery" />
          <div className="pdp-skeleton-info">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-empty">
        <h1>Product not found</h1>
        <p>This item may have been removed or is unavailable.</p>
        <Link className="shop-btn shop-btn-primary" to="/customer/products">
          Browse products
        </Link>
      </div>
    );
  }

  const image = images[activeImage]?.url || images[0]?.url;
  const pricing = getVariantPricing(product, matchedVariant);
  const { price, mrp, offer } = pricing;
  const { average, total } = getProductRating(product);
  const storeId = product.store?._id || product.store;
  const descriptionHtml = sanitizeProductHtml(product.description);
  const aboutItems = product.aboutItems || [];
  const specifications = product.specifications || [];
  const optionGroups = product.optionGroups || [];
  const hasDescription =
    Boolean(descriptionHtml) && descriptionHtml !== "<br>" && descriptionHtml !== "";

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "about") return aboutItems.length > 0;
    if (t.id === "description") return hasDescription;
    if (t.id === "specs") return specifications.length > 0;
    return true;
  });

  function selectImage(index) {
    if (!images.length) return;
    setActiveImage(((index % images.length) + images.length) % images.length);
  }

  function chooseOption(key, value) {
    setSelected((prev) => ({ ...prev, [key]: value }));
  }

  function isOptionAvailable(key, value) {
    const trial = { ...selected, [key]: value };
    const keys = Object.keys(trial).filter((k) => trial[k]);
    if (!(product.variants || []).length) return true;
    return (product.variants || []).some(
      (v) =>
        keys.every((k) => String(v[k] || "") === String(trial[k])) &&
        Number(v.stock) > 0
    );
  }

  function addItem({ goCheckout = false } = {}) {
    if (!requireAuth("Please login to add items to your cart.")) return false;
    if (availableStock <= 0) {
      notify.warning("This option is out of stock.");
      return false;
    }
    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price,
        storeId,
        stock: availableStock,
        image: images[0]?.url || image || null,
        options: { ...selected },
        variantLabel: Object.values(selected).filter(Boolean).join(" / "),
      })
    );
    if (goCheckout) {
      notify.success("Added — taking you to cart.");
      navigate("/customer/cart");
    } else {
      setAddedFlash(true);
      notify.success("Added to cart.");
      window.setTimeout(() => setAddedFlash(false), 1800);
    }
    return true;
  }

  function wishItem() {
    if (!requireAuth("Please login to save items to your wishlist.")) return;
    dispatch(
      toggleWishlist({
        productId: product._id,
        name: product.name,
        price,
        image: images[0]?.url || image || null,
        storeId,
      })
    );
    notify.info(wished ? "Removed from wishlist." : "Saved to wishlist.");
  }

  function onMediaMove(event) {
    if (!image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setLens({ show: true, x, y });
  }

  return (
    <div className="pdp-page">
      <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/customer">Home</Link>
        <span>/</span>
        <Link to="/customer/products">Products</Link>
        {product.category?.slug ? (
          <>
            <span>/</span>
            <Link to={`/customer/products?category=${product.category.slug}`}>
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <em>{product.name}</em>
      </nav>

      <div className="pdp-hero">
        <div className={`pdp-gallery ${images.length <= 1 ? "pdp-gallery--solo" : ""}`}>
          <div className="pdp-gallery-media">
            {images.length > 1 ? (
              <div className="pdp-thumbs" role="tablist" aria-label="Product images">
                {images.map((img, i) => (
                  <button
                    key={img.public_id || img.url || i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImage}
                    className={i === activeImage ? "is-active" : ""}
                    onClick={() => selectImage(i)}
                    onMouseEnter={() => selectImage(i)}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="pdp-stage">
              <button
                type="button"
                className={`pdp-wish ${wished ? "is-on" : ""}`}
                onClick={wishItem}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              >
                <i className={`${wished ? "fa-solid" : "fa-regular"} fa-heart`} aria-hidden="true" />
              </button>

              <div
                className={`pdp-stage-media ${lens.show ? "is-zooming" : ""}`}
                onMouseMove={onMediaMove}
                onMouseLeave={() => setLens((prev) => ({ ...prev, show: false }))}
              >
                {image ? (
                  <StableProductImage
                    src={image}
                    alt={product.name}
                    className="pdp-stable-media"
                    imgClassName={lens.show ? "is-zooming" : ""}
                    style={
                      lens.show
                        ? {
                            transformOrigin: `${lens.x}% ${lens.y}%`,
                            transform: "scale(1.35)",
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="pdp-stage-empty">No image available</div>
                )}
              </div>

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="pdp-nav pdp-nav--prev"
                    aria-label="Previous image"
                    onClick={() => selectImage(activeImage - 1)}
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="pdp-nav pdp-nav--next"
                    aria-label="Next image"
                    onClick={() => selectImage(activeImage + 1)}
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                  <span className="pdp-count">
                    {activeImage + 1}/{images.length}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pdp-buybox">
          <div className="pdp-meta">
            {product.brand ? <span className="pdp-brand">{product.brand}</span> : null}
            {product.store?.storeName ? (
              <Link
                className="pdp-store"
                to={storeId ? `/customer/stores/${storeId}` : "#"}
              >
                Sold by {product.store.storeName}
              </Link>
            ) : null}
          </div>

          <h1 className="pdp-title">{product.name}</h1>
          {product.shortDescription ? (
            <p className="pdp-tagline">{product.shortDescription}</p>
          ) : null}

          <button
            type="button"
            className="pdp-rating-link"
            onClick={() => {
              setTab("reviews");
              document.getElementById("pdp-tabs")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="shop-rating">
              <i className="fa-solid fa-star" aria-hidden="true" />{" "}
              {average ? average.toFixed(1) : "New"}
            </span>
            <span className="pdp-rating-text">
              {total ? `${total} ratings & reviews` : "Be the first to review"}
            </span>
          </button>

          <div className="pdp-price-block">
            <div className="pdp-price-row">
              <strong>₹{price.toLocaleString("en-IN")}</strong>
              {mrp > price ? (
                <span className="pdp-mrp">₹{mrp.toLocaleString("en-IN")}</span>
              ) : null}
              {offer ? <span className="pdp-offer">{offer}% off</span> : null}
            </div>
            <p className="pdp-price-note">Inclusive of all taxes</p>
          </div>

          {optionGroups.map((group) => (
            <div key={group.key} className="pdp-options">
              <div className="pdp-options-label">
                <span>{group.label}</span>
                <strong>{selected[group.key]}</strong>
              </div>
              <div className="pdp-chips" role="listbox" aria-label={group.label}>
                {group.values.map((value) => {
                  const available = isOptionAvailable(group.key, value);
                  const active = selected[group.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`pdp-chip ${active ? "is-active" : ""} ${
                        !available ? "is-disabled" : ""
                      }`}
                      disabled={!available && !active}
                      onClick={() => chooseOption(group.key, value)}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className={`pdp-stock ${availableStock > 0 ? "is-in" : "is-out"}`}>
            <i
              className={`fa-solid ${availableStock > 0 ? "fa-circle-check" : "fa-circle-xmark"}`}
              aria-hidden="true"
            />
            {availableStock > 0
              ? availableStock <= 5
                ? `Only ${availableStock} left — order soon`
                : `${availableStock} in stock`
              : "Out of stock for this selection"}
          </div>

          <div className="pdp-cta-buybox">
            {isCustomer ? (
              <>
                <button
                  type="button"
                  className="shop-btn shop-btn-primary"
                  disabled={!availableStock}
                  onClick={() => addItem()}
                >
                  <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                  {addedFlash ? "Added!" : "Add to cart"}
                </button>
                <button
                  type="button"
                  className="shop-btn shop-btn-yellow"
                  disabled={!availableStock}
                  onClick={() => addItem({ goCheckout: true })}
                >
                  <i className="fa-solid fa-bolt" aria-hidden="true" />
                  Buy now
                </button>
              </>
            ) : (
              <Link
                className="shop-btn shop-btn-primary pdp-cta-guest"
                to="/login"
                state={{ from: location }}
              >
                <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
                Login to buy
              </Link>
            )}
          </div>

          <ul className="pdp-perks">
            <li>
              <i className="fa-solid fa-truck-fast" aria-hidden="true" />{" "}
              {(() => {
                const fee = storeInfo?.shippingFee;
                const freeAbove = storeInfo?.freeShippingAbove;
                if (freeAbove && price >= freeAbove) return "Free delivery";
                if (fee === 0) return "Free delivery";
                if (fee > 0) return `Delivery ₹${fee}`;
                return "Fast delivery";
              })()}
            </li>
            <li>
              <i className="fa-solid fa-rotate-left" aria-hidden="true" />{" "}
              {storeInfo?.returnPolicy ? "Returns available" : "Easy returns"}
            </li>
            <li>
              <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Secure checkout
            </li>
          </ul>

          {product.store?.storeName ? (
            <div className="pdp-store-card">
              <div className="pdp-store-card__head">
                <span className="pdp-store-card__avatar" aria-hidden="true">
                  <i className="fa-solid fa-store" />
                </span>
                <div className="pdp-store-card__id">
                  <span className="pdp-store-card__label">Sold by</span>
                  <Link
                    className="pdp-store-card__name"
                    to={storeId ? `/customer/stores/${storeId}` : "#"}
                  >
                    {product.store.storeName}
                  </Link>
                </div>
                {storeId ? (
                  <Link className="pdp-store-card__visit" to={`/customer/stores/${storeId}`}>
                    Visit store
                  </Link>
                ) : null}
              </div>
              <ul className="pdp-store-card__facts">
                <li>
                  <i className="fa-solid fa-truck" aria-hidden="true" />
                  <span>
                    {storeInfo?.freeShippingAbove
                      ? `Free delivery above ₹${storeInfo.freeShippingAbove}`
                      : storeInfo?.shippingFee > 0
                        ? `Shipping ₹${storeInfo.shippingFee}`
                        : "Free shipping"}
                    {storeInfo?.estimatedDeliveryDays
                      ? ` · ~${storeInfo.estimatedDeliveryDays} days`
                      : ""}
                  </span>
                </li>
                <li>
                  <i className="fa-solid fa-rotate-left" aria-hidden="true" />
                  <span>
                    {storeInfo?.returnPolicy ||
                      "Standard returns as per platform policy."}
                  </span>
                </li>
                <li>
                  <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                  <span>Buyer protection on eligible orders.</span>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <section className="pdp-tabs-wrap" id="pdp-tabs">
        <div className="pdp-tabs" role="tablist">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "is-active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "reviews" && total ? <em>{total}</em> : null}
            </button>
          ))}
        </div>

        <div className="pdp-tab-panel">
          {tab === "about" && aboutItems.length ? (
            <ul className="pdp-highlights">
              {aboutItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : null}

          {tab === "description" && hasDescription ? (
            <div
              className="pdp-prose"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : null}

          {tab === "specs" && specifications.length ? (
            <table className="pdp-specs">
              <tbody>
                {specifications.map((row) => (
                  <tr key={`${row.label}-${row.value}`}>
                    <th>{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "reviews" ? (
            <ProductReviews
              productId={product._id}
              embedded
              onStatsChange={({ averageRating, totalReviews }) => {
                setProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        averageRating: averageRating ?? prev.averageRating,
                        totalReviews: totalReviews ?? prev.totalReviews,
                      }
                    : prev
                );
              }}
            />
          ) : null}
        </div>
      </section>

      {related.length ? (
        <section className="shop-section pdp-related">
          <div className="shop-section-head">
            <h2>You may also like</h2>
            <Link
              to={
                product.category?.slug
                  ? `/customer/products?category=${product.category.slug}`
                  : "/customer/products"
              }
            >
              VIEW ALL
            </Link>
          </div>
          <div className="shop-product-rail">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="pdp-mobile-bar">
        <button
          type="button"
          className={`pdp-mobile-wish ${wished ? "is-on" : ""}`}
          onClick={wishItem}
          aria-label="Wishlist"
        >
          <i className={`${wished ? "fa-solid" : "fa-regular"} fa-heart`} aria-hidden="true" />
        </button>
        {isCustomer ? (
          <>
            <button
              type="button"
              className="shop-btn shop-btn-primary"
              disabled={!availableStock}
              onClick={() => addItem()}
            >
              {addedFlash ? "Added!" : "Add to cart"}
            </button>
            <button
              type="button"
              className="shop-btn shop-btn-yellow"
              disabled={!availableStock}
              onClick={() => addItem({ goCheckout: true })}
            >
              Buy now
            </button>
          </>
        ) : (
          <Link
            className="shop-btn shop-btn-primary"
            to="/login"
            state={{ from: location }}
            style={{ flex: 1 }}
          >
            Login to buy
          </Link>
        )}
      </div>
    </div>
  );
};

export default CustomerProductDetail;
