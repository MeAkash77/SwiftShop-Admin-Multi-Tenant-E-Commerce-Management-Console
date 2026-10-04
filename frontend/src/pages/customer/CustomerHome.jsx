import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { bannerApi, categoryApi, productApi, storeApi, unwrapList } from "../../api/services";
import HomeHeroSlider from "../../components/shop/HomeHeroSlider";
import ProductCard from "../../components/shop/ProductCard";
import { ProductGridSkeleton } from "../../components/shop/LoadingStates";
import {
  DealCountdown,
  RecentlyViewedRail,
  TrustPerkStrip,
  WelcomeBackBanner,
} from "../../components/shop/EngagementBlocks";
import { useRequireCustomerAuth } from "../../hooks/useRequireCustomerAuth";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import { recordVisit } from "../../utils/visitTracker";
import {
  readShopCache,
  writeShopCache,
  SHOP_CACHE_KEYS,
} from "../../utils/shopBootstrapCache";
import { getProductPricing } from "../../utils/productDisplay";

function readHomeBootstrap() {
  return readShopCache(SHOP_CACHE_KEYS.home) || null;
}

/** Pick next N products never shown before (stops home-page repeats). */
function takeUnique(list, used, n) {
  const out = [];
  for (const p of list) {
    const id = String(p._id);
    if (!id || used.has(id)) continue;
    used.add(id);
    out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

const CustomerHome = () => {
  const { isCustomer } = useRequireCustomerAuth();
  const user = useSelector((state) => state.user.user);
  const cached = readHomeBootstrap();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState(() => cached?.products || []);
  const [categories, setCategories] = useState(() => cached?.categories || []);
  const [sliders, setSliders] = useState(() => cached?.sliders || []);
  const [offers, setOffers] = useState(() => cached?.offers || []);
  const [loading, setLoading] = useState(() => !cached?.products?.length);
  const [visit, setVisit] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setVisit(recordVisit());
    setRecent(getRecentlyViewed());
  }, []);

  // Critical path only — products + categories + banners (no stores wait)
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [productsRes, categoriesRes, bannersRes] = await Promise.all([
          productApi.list({ status: "active", page: 1, limit: 24, sort: "newest" }),
          categoryApi.list(),
          bannerApi.list(),
        ]);
        if (!active) return;

        const nextProducts = unwrapList(productsRes.data).data;
        const cats = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.data || [];
        const banners = bannersRes.data?.banners || [];
        const nextSliders = banners.filter((b) => b.type === "slider");
        const nextOffers = banners.filter((b) => b.type === "offer").slice(0, 3);

        setProducts(nextProducts);
        setCategories(cats);
        setSliders(nextSliders);
        setOffers(nextOffers);

        writeShopCache(SHOP_CACHE_KEYS.home, {
          products: nextProducts,
          categories: cats,
          sliders: nextSliders,
          offers: nextOffers,
        });
        writeShopCache(SHOP_CACHE_KEYS.categories, cats);
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
  }, []);

  // Defer store strip — not needed for first paint
  useEffect(() => {
    if (!isCustomer) {
      setStores([]);
      return undefined;
    }
    let active = true;
    storeApi
      .list()
      .then((res) => {
        if (active) setStores((res.data?.data || []).slice(0, 4));
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [isCustomer]);

  const { deals, fresh, trending } = useMemo(() => {
    const used = new Set();
    const byDiscount = [...products]
      .filter((p) => {
        const { offer } = getProductPricing(p);
        return offer >= 10;
      })
      .sort((a, b) => {
        const oa = getProductPricing(a).offer || 0;
        const ob = getProductPricing(b).offer || 0;
        return ob - oa;
      });

    const dealsList = takeUnique(byDiscount.length ? byDiscount : products, used, 6);

    const freshList = takeUnique(products, used, 6);

    const byRating = [...products].sort(
      (a, b) =>
        (b.averageRating || 0) - (a.averageRating || 0) ||
        (b.totalReviews || 0) - (a.totalReviews || 0) ||
        (b.createdAt || "").localeCompare(a.createdAt || "")
    );
    const trendingList = takeUnique(byRating, used, 6);

    return { deals: dealsList, fresh: freshList, trending: trendingList };
  }, [products]);

  const recentUnique = useMemo(() => {
    const shown = new Set(
      [...deals, ...fresh, ...trending].map((p) => String(p._id))
    );
    return (recent || []).filter((r) => !shown.has(String(r.productId || r._id)));
  }, [recent, deals, fresh, trending]);

  const categoryTiles = useMemo(
    () => categories.filter((c) => c.status !== false).slice(0, 8),
    [categories]
  );

  const firstName = user?.firstName;

  return (
    <div className="home-page">
      <HomeHeroSlider slides={sliders} />

      {visit?.isReturning ? <WelcomeBackBanner visit={visit} /> : null}

      <section className="home-intro">
        <div className="home-intro-copy">
          <p className="home-intro-kicker">MultiCommerce</p>
          <h2>
            {firstName ? `Welcome back, ${firstName}` : "Shop across many trusted stores"}
          </h2>
          <p>
            Clear deals, fresh arrivals, and calm browsing — no account needed until checkout.
          </p>
        </div>
        <div className="home-intro-actions">
          <Link className="shop-btn shop-btn-primary" to="/customer/products">
            Browse all
          </Link>
          {!isCustomer ? (
            <Link className="shop-btn shop-btn-outline" to="/login">
              Login to buy
            </Link>
          ) : (
            <Link className="shop-btn shop-btn-outline" to="/customer/account/wishlist">
              Wishlist
            </Link>
          )}
        </div>
      </section>

      <TrustPerkStrip />

      <section className="shop-section shop-category-grid-section home-categories">
        <div className="shop-section-head">
          <div>
            <h2>Shop by category</h2>
            <p className="cx-section-sub">One tap into Electronics, Fashion, Home and more</p>
          </div>
          <Link to="/customer/products">VIEW ALL</Link>
        </div>
        <div className="shop-category-grid">
          {categoryTiles.map((c) => (
            <Link
              key={c._id}
              className="shop-category-tile"
              to={`/customer/products?category=${c.slug}`}
            >
              <span className="shop-category-tile-icon">
                <i className={getCategoryIcon(c.slug)} aria-hidden="true" />
              </span>
              <strong>{c.name}</strong>
            </Link>
          ))}
          {!loading && !categoryTiles.length ? (
            <p className="shop-muted">Categories will appear once the catalog is ready.</p>
          ) : null}
        </div>
      </section>

      {offers.length ? (
        <section className="shop-section home-offers">
          <div className="shop-section-head">
            <div>
              <h2>Special offers</h2>
              <p className="cx-section-sub">Limited-time deals from our stores</p>
            </div>
            <Link to="/customer/products">VIEW ALL</Link>
          </div>
          <div className="shop-offer-rail">
            {offers.map((offer) => (
              <Link
                key={offer._id}
                className="shop-offer-card"
                to={
                  offer.linkUrl ||
                  (offer.category?.slug
                    ? `/customer/products?category=${offer.category.slug}`
                    : "/customer/products")
                }
              >
                {offer.image?.url ? (
                  <img
                    className="shop-offer-card__image"
                    src={offer.image.url}
                    alt={offer.title}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="shop-offer-card__fallback" aria-hidden="true" />
                )}
                <div className="shop-offer-card__shade" aria-hidden="true" />
                <div className="shop-offer-card__content">
                  {offer.store?.storeName ? (
                    <span className="shop-offer-card__store">
                      <i className="fa-solid fa-store" aria-hidden="true" />
                      {offer.store.storeName}
                    </span>
                  ) : null}
                  {offer.badgeText ? (
                    <em className="shop-offer-card__badge">{offer.badgeText}</em>
                  ) : null}
                  <h3>{offer.title}</h3>
                  {offer.subtitle ? <p>{offer.subtitle}</p> : null}
                  <span className="shop-offer-card__cta">
                    Shop now
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="shop-section home-deals">
        <div className="shop-section-head">
          <div>
            <h2>Deals of the day</h2>
            <p className="cx-section-sub">Best discounts — each item appears only here</p>
          </div>
          <div className="home-deals-meta">
            <DealCountdown />
            <Link to="/customer/products">VIEW ALL</Link>
          </div>
        </div>
        {loading && !deals.length ? (
          <ProductGridSkeleton count={4} rail />
        ) : deals.length ? (
          <div className="shop-product-rail">
            {deals.map((product) => (
              <ProductCard key={product._id} product={product} highlightDeal />
            ))}
          </div>
        ) : (
          <p className="shop-muted" style={{ padding: "0 4px" }}>
            New deals land here as sellers add offers.
          </p>
        )}
      </section>

      {recentUnique.length ? <RecentlyViewedRail items={recentUnique} /> : null}

      <section className="shop-section home-fresh">
        <div className="shop-section-head">
          <div>
            <h2>New arrivals</h2>
            <p className="cx-section-sub">Fresh listings you have not seen in Deals</p>
          </div>
          <Link to="/customer/products">VIEW ALL</Link>
        </div>
        {loading && !fresh.length ? (
          <ProductGridSkeleton count={4} rail />
        ) : fresh.length ? (
          <div className="shop-product-rail">
            {fresh.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      {trending.length ? (
        <section className="shop-section home-trending">
          <div className="shop-section-head">
            <div>
              <h2>Worth a look</h2>
              <p className="cx-section-sub">More picks — never repeating Deals or New arrivals</p>
            </div>
            <Link to="/customer/products">VIEW ALL</Link>
          </div>
          <div className="shop-product-rail">
            {trending.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {isCustomer && stores.length ? (
        <section className="shop-section home-stores">
          <div className="shop-section-head">
            <div>
              <h2>Stores to follow</h2>
              <p className="cx-section-sub">Trusted sellers on the platform</p>
            </div>
            <Link to="/customer/stores">VIEW ALL</Link>
          </div>
          <div className="shop-store-strip">
            {stores.map((store) => (
              <Link
                className="shop-store-card"
                key={store._id}
                to={`/customer/stores/${store._id}`}
              >
                <h3>{store.storeName}</h3>
                <p>{store.description || "Shop this vendor"}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default CustomerHome;
