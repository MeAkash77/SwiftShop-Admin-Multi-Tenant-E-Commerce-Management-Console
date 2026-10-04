import { useState } from "react";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect fill="#f3f4f6" width="400" height="400"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#9ca3af" font-family="system-ui,sans-serif" font-size="16">No image</text>
    </svg>`
  );

/**
 * Calm product image: fixed frame, no flashy fallback spam, fades in once.
 */
export default function StableProductImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  style,
  onLoad: onLoadProp,
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showSrc = src && !failed ? src : PLACEHOLDER;

  return (
    <div className={`shop-img-frame ${className}`.trim()}>
      {!loaded && src && !failed ? <span className="shop-img-skeleton" aria-hidden="true" /> : null}
      <img
        src={showSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`shop-img-el ${loaded ? "is-loaded" : ""} ${imgClassName}`.trim()}
        style={style}
        onLoad={(e) => {
          setLoaded(true);
          onLoadProp?.(e);
        }}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}

/** Normalize Unsplash/CDN URLs so w=800 and w=1200 of the same photo count as one. */
function imageFingerprint(url = "") {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    // Unsplash: photo id is stable; query (w/q) varies
    if (u.hostname.includes("unsplash.com")) return `unsplash:${path}`;
    return `${u.hostname}${path}`;
  } catch {
    return String(url).split("?")[0];
  }
}

/** Unique gallery photos (catalog often stored the same asset twice). */
export function uniqueImageList(images = []) {
  const seen = new Set();
  const out = [];
  for (const img of images) {
    const url = img?.url;
    if (!url) continue;
    const key = imageFingerprint(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(img);
  }
  return out;
}
