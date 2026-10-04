import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function slideHref(slide) {
  if (slide.linkUrl) return slide.linkUrl;
  if (slide.category?.slug) return `/customer/products?category=${slide.category.slug}`;
  return "/customer/products";
}

/**
 * Marketplace hero carousel driven by admin/vendor banner CMS.
 */
const HomeHeroSlider = ({ slides = [] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="shop-hero-slider shop-hero-slider--fallback">
        <div className="shop-hero-slide-content">
          <span className="shop-hero-brand">MultiCommerce</span>
          <h1>Many stores. One calm place to shop.</h1>
          <p>
            Browse trusted sellers, clear deals, and everyday essentials — sign in when you are ready to buy.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link className="shop-btn shop-btn-primary" to="/customer/products">
              Start shopping
            </Link>
            <Link className="shop-btn shop-btn-outline" to="/customer/info/help-center" style={{ background: "rgba(255,255,255,0.95)" }}>
              Why shop here
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="shop-hero-slider" aria-roledescription="carousel">
      {slides.map((slide, i) => (
        <Link
          key={slide._id || i}
          to={slideHref(slide)}
          className={`shop-hero-slide ${i === index ? "is-active" : ""}`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
        >
          {slide.image?.url ? (
            <img
              src={slide.image.url}
              alt={slide.title}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === 0 ? "high" : "low"}
            />
          ) : null}
          <div className="shop-hero-slide-content">
            {slide.badgeText ? (
              <span className="shop-hero-badge">{slide.badgeText}</span>
            ) : (
              <span className="shop-hero-brand">MultiCommerce</span>
            )}
            <h1>{slide.title}</h1>
            {slide.subtitle ? <p>{slide.subtitle}</p> : null}
          </div>
        </Link>
      ))}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            className="shop-hero-nav shop-hero-nav--prev"
            aria-label="Previous slide"
            onClick={() =>
              setIndex((prev) => (prev - 1 + slides.length) % slides.length)
            }
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="shop-hero-nav shop-hero-nav--next"
            aria-label="Next slide"
            onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
          <div className="shop-hero-dots">
            {slides.map((slide, i) => (
              <button
                key={slide._id || i}
                type="button"
                className={i === index ? "is-active" : ""}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default HomeHeroSlider;
