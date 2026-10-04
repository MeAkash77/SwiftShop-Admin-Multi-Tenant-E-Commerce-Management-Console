/**
 * Attractive SVG brand banner templates for admin + vendor marketing.
 * Artwork is vector-only (no baked-in title text). Text comes from banner fields
 * and is overlaid by the customer home slider.
 */

export const BANNER_TEMPLATES = [
  {
    id: "flash-sale",
    title: "Flash Sale",
    subtitle: "Limited time deals you don’t want to miss",
    badgeText: "UP TO 50% OFF",
    type: "slider",
    colors: { a: "#111827", b: "#dc2626", c: "#fbbf24", d: "#ffffff" },
  },
  {
    id: "new-arrivals",
    title: "New Arrivals",
    subtitle: "Fresh products just landed in store",
    badgeText: "JUST IN",
    type: "slider",
    colors: { a: "#0f766e", b: "#14b8a6", c: "#99f6e4", d: "#ffffff" },
  },
  {
    id: "mobile-deals",
    title: "Mobile Deals",
    subtitle: "Smartphones and gadgets at better prices",
    badgeText: "BEST PRICE",
    type: "slider",
    colors: { a: "#1e3a8a", b: "#2563eb", c: "#93c5fd", d: "#ffffff" },
  },
  {
    id: "fashion-edit",
    title: "Fashion Edit",
    subtitle: "Everyday style with a modern look",
    badgeText: "TRENDING",
    type: "slider",
    colors: { a: "#831843", b: "#db2777", c: "#f9a8d4", d: "#ffffff" },
  },
  {
    id: "electronics",
    title: "Electronics Hub",
    subtitle: "Accessories, gadgets and smart picks",
    badgeText: "HOT DEALS",
    type: "slider",
    colors: { a: "#312e81", b: "#7c3aed", c: "#c4b5fd", d: "#ffffff" },
  },
  {
    id: "home-living",
    title: "Home & Living",
    subtitle: "Essentials that make home feel better",
    badgeText: "SAVE MORE",
    type: "slider",
    colors: { a: "#14532d", b: "#22c55e", c: "#86efac", d: "#ffffff" },
  },
  {
    id: "premium",
    title: "Premium Collection",
    subtitle: "Handpicked quality for serious shoppers",
    badgeText: "PREMIUM",
    type: "slider",
    colors: { a: "#18181b", b: "#52525b", c: "#facc15", d: "#ffffff" },
  },
  {
    id: "festival",
    title: "Festival Sale",
    subtitle: "Celebrate with special store offers",
    badgeText: "BIG SALE",
    type: "slider",
    colors: { a: "#7c2d12", b: "#f97316", c: "#fdba74", d: "#ffffff" },
  },
  {
    id: "beauty",
    title: "Beauty & Care",
    subtitle: "Daily care products for every routine",
    badgeText: "POPULAR",
    type: "slider",
    colors: { a: "#9f1239", b: "#fb7185", c: "#fecdd3", d: "#ffffff" },
  },
  {
    id: "sports",
    title: "Sports & Fitness",
    subtitle: "Gear up for active days ahead",
    badgeText: "ACTIVE",
    type: "slider",
    colors: { a: "#064e3b", b: "#10b981", c: "#6ee7b7", d: "#ffffff" },
  },
  {
    id: "grocery",
    title: "Daily Grocery",
    subtitle: "Fresh essentials for your home",
    badgeText: "FRESH",
    type: "slider",
    colors: { a: "#365314", b: "#84cc16", c: "#d9f99d", d: "#ffffff" },
  },
  {
    id: "clearance",
    title: "Clearance Corner",
    subtitle: "Last pieces at special prices",
    badgeText: "LIMITED",
    type: "slider",
    colors: { a: "#0f172a", b: "#64748b", c: "#cbd5e1", d: "#ffffff" },
  },
  {
    id: "store-brand",
    title: "Shop Our Store",
    subtitle: "Trusted products from a verified seller",
    badgeText: "OFFICIAL",
    type: "slider",
    colors: { a: "#0c4a6e", b: "#0284c7", c: "#7dd3fc", d: "#ffffff" },
  },
  {
    id: "weekend",
    title: "Weekend Specials",
    subtitle: "Extra savings for the weekend",
    badgeText: "WEEKEND",
    type: "slider",
    colors: { a: "#4c1d95", b: "#8b5cf6", c: "#ddd6fe", d: "#ffffff" },
  },
  {
    id: "gift-picks",
    title: "Gift Picks",
    subtitle: "Thoughtful products for every occasion",
    badgeText: "GIFT IDEAS",
    type: "slider",
    colors: { a: "#881337", b: "#e11d48", c: "#fda4af", d: "#ffffff" },
  },
  {
    id: "mega-offer",
    title: "Mega Offer Day",
    subtitle: "Top categories with bigger discounts",
    badgeText: "MEGA DEAL",
    type: "offer",
    colors: { a: "#1f2937", b: "#f59e0b", c: "#fde68a", d: "#ffffff" },
  },
];

function categoryObjectSvg(template) {
  const { c, d } = template.colors;
  const common = `stroke="${d}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"`;

  switch (template.id) {
    case "mobile-deals":
      return `
        <g transform="translate(1125 45)" filter="url(#shadow)">
          <rect x="110" y="8" width="178" height="330" rx="30" fill="${d}" fill-opacity=".16" ${common}/>
          <rect x="132" y="48" width="134" height="226" rx="14" fill="${c}" fill-opacity=".78"/>
          <circle cx="199" cy="306" r="11" fill="${d}"/>
          <circle cx="154" cy="73" r="13" fill="${d}" fill-opacity=".72"/>
          <circle cx="187" cy="73" r="13" fill="${d}" fill-opacity=".45"/>
          <path d="M342 112l42 16-18 46-45-15 21-47Z" fill="${c}" fill-opacity=".9" ${common}/>
          <path d="M337 208c28 0 50 22 50 50v28M316 235h42" ${common}/>
        </g>`;
    case "fashion-edit":
      return `
        <g transform="translate(1090 52)" filter="url(#shadow)">
          <path d="M85 138h250l28 190H57l28-190Z" fill="${d}" fill-opacity=".18" ${common}/>
          <path d="M130 144c0-62 32-96 80-96s80 34 80 96" ${common}/>
          <path d="M170 160v45M250 160v45" ${common}/>
          <path d="M402 94c-18 0-31 14-31 31s13 31 31 31c16 0 29-12 31-27h38c2 15 15 27 31 27 18 0 31-14 31-31s-13-31-31-31c-14 0-26 9-30 21h-40c-4-12-16-21-30-21Z" fill="${c}" fill-opacity=".86" ${common}/>
        </g>`;
    case "electronics":
      return `
        <g transform="translate(1070 58)" filter="url(#shadow)">
          <rect x="35" y="18" width="300" height="205" rx="18" fill="${d}" fill-opacity=".15" ${common}/>
          <rect x="62" y="47" width="246" height="146" rx="7" fill="${c}" fill-opacity=".75"/>
          <path d="M12 238h346l-34 55H46l-34-55Z" fill="${d}" fill-opacity=".26" ${common}/>
          <path d="M402 98c0-51 38-84 83-84s83 33 83 84" ${common}/>
          <rect x="381" y="92" width="51" height="102" rx="22" fill="${c}" ${common}/>
          <rect x="538" y="92" width="51" height="102" rx="22" fill="${c}" ${common}/>
        </g>`;
    case "home-living":
      return `
        <g transform="translate(1065 80)" filter="url(#shadow)">
          <path d="M52 148c0-31 25-56 56-56h215c31 0 56 25 56 56v119H52V148Z" fill="${d}" fill-opacity=".18" ${common}/>
          <rect x="20" y="184" width="392" height="104" rx="26" fill="${c}" fill-opacity=".74" ${common}/>
          <path d="M67 288v38M365 288v38M216 187v96" ${common}/>
          <path d="M470 71h116l-35 91h-46l-35-91Z" fill="${d}" fill-opacity=".3" ${common}/>
          <path d="M528 162v128M493 290h70" ${common}/>
        </g>`;
    case "premium":
      return `
        <g transform="translate(1120 55)" filter="url(#shadow)">
          <path d="M45 118 133 25h190l88 93-183 210L45 118Z" fill="${c}" fill-opacity=".74" ${common}/>
          <path d="m45 118 366 0M133 25l95 303M323 25 228 328M133 25l95 93 95-93" ${common}/>
          <path d="M468 55v65M436 87h65M503 180v45M480 203h46" ${common}/>
        </g>`;
    case "festival":
      return `
        <g transform="translate(1080 55)" filter="url(#shadow)">
          <path d="M52 178c0 84 69 152 154 152s154-68 154-152H52Z" fill="${c}" fill-opacity=".82" ${common}/>
          <path d="M206 170c-48-44-34-92 0-142 34 50 48 98 0 142Z" fill="${d}" fill-opacity=".72" ${common}/>
          <path d="M420 64h132v126H420V64Z" fill="${d}" fill-opacity=".17" ${common}/>
          <path d="M486 64v126M420 126h132M405 64h162" ${common}/>
          <path d="M486 27v37" ${common}/>
        </g>`;
    case "beauty":
      return `
        <g transform="translate(1100 45)" filter="url(#shadow)">
          <rect x="58" y="112" width="118" height="224" rx="26" fill="${c}" fill-opacity=".78" ${common}/>
          <path d="M85 112V60h64v52M70 60h94" ${common}/>
          <rect x="220" y="70" width="104" height="266" rx="22" fill="${d}" fill-opacity=".2" ${common}/>
          <path d="M240 70V29h64v41M226 188h92" ${common}/>
          <path d="M395 306c77-27 99-100 71-181-78 27-101 100-71 181Z" fill="${c}" fill-opacity=".68" ${common}/>
          <path d="M395 306 466 125" ${common}/>
        </g>`;
    case "sports":
      return `
        <g transform="translate(1050 67)" filter="url(#shadow)">
          <path d="M35 231c70 3 126-29 179-96 32 68 78 101 154 108-13 47-59 74-123 74H71c-37 0-55-34-36-86Z" fill="${c}" fill-opacity=".8" ${common}/>
          <path d="M173 177 226 215M125 207l54 42" ${common}/>
          <circle cx="465" cy="150" r="102" fill="${d}" fill-opacity=".17" ${common}/>
          <path d="m465 78 43 31-16 51h-54l-16-51 43-31ZM438 160l-46 33M492 160l45 33M422 109l-49-7M508 109l49-7" ${common}/>
        </g>`;
    case "grocery":
      return `
        <g transform="translate(1080 65)" filter="url(#shadow)">
          <path d="M58 144h326l-38 172H96L58 144Z" fill="${d}" fill-opacity=".17" ${common}/>
          <path d="M129 146c0-73 50-116 92-116s92 43 92 116M73 198h297" ${common}/>
          <circle cx="135" cy="236" r="39" fill="${c}" fill-opacity=".85"/>
          <circle cx="220" cy="226" r="47" fill="${c}" fill-opacity=".62"/>
          <path d="M287 274c-14-70 12-121 77-151 18 67-4 119-77 151Z" fill="${c}" fill-opacity=".85" ${common}/>
          <path d="M286 274 364 123" ${common}/>
        </g>`;
    case "clearance":
      return `
        <g transform="translate(1100 56)" filter="url(#shadow)">
          <path d="M54 66h264l120 120-190 190L54 182V66Z" fill="${c}" fill-opacity=".72" ${common}/>
          <circle cx="120" cy="128" r="25" fill="${d}" fill-opacity=".8"/>
          <path d="M196 138 319 261M306 127l-121 146" ${common}/>
          <circle cx="220" cy="144" r="20" fill="none" ${common}/>
          <circle cx="286" cy="257" r="20" fill="none" ${common}/>
        </g>`;
    case "store-brand":
      return `
        <g transform="translate(1080 56)" filter="url(#shadow)">
          <path d="M61 112h350l-31 78H92l-31-78Z" fill="${c}" fill-opacity=".82" ${common}/>
          <path d="M102 190v144h268V190M159 334v-92h90v92M286 245h48v50h-48z" fill="${d}" fill-opacity=".13" ${common}/>
          <path d="M83 112 127 46h220l43 66" ${common}/>
          <circle cx="453" cy="86" r="55" fill="${c}" ${common}/>
          <path d="m429 86 16 16 32-37" ${common}/>
        </g>`;
    case "weekend":
      return `
        <g transform="translate(1110 50)" filter="url(#shadow)">
          <rect x="36" y="54" width="304" height="276" rx="28" fill="${d}" fill-opacity=".17" ${common}/>
          <path d="M36 126h304M106 25v62M270 25v62" ${common}/>
          <g fill="${c}">
            <circle cx="105" cy="180" r="18"/><circle cx="188" cy="180" r="18"/><circle cx="271" cy="180" r="18"/>
            <circle cx="105" cy="249" r="18"/><circle cx="188" cy="249" r="18"/><circle cx="271" cy="249" r="18"/>
          </g>
          <path d="M406 110v75M369 147h75M440 245v50M415 270h50" ${common}/>
        </g>`;
    case "gift-picks":
      return `
        <g transform="translate(1085 58)" filter="url(#shadow)">
          <rect x="66" y="145" width="350" height="181" rx="16" fill="${d}" fill-opacity=".17" ${common}/>
          <rect x="39" y="103" width="404" height="70" rx="16" fill="${c}" fill-opacity=".8" ${common}/>
          <path d="M241 104v222" ${common}/>
          <path d="M236 102c-78-3-116-29-104-67 14-44 84-10 104 67ZM246 102c78-3 116-29 104-67-14-44-84-10-104 67Z" fill="${c}" fill-opacity=".72" ${common}/>
        </g>`;
    case "mega-offer":
    case "flash-sale":
      return `
        <g transform="translate(1110 47)" filter="url(#shadow)">
          <path d="m238 7-132 190h112l-42 170 188-227H245L287 7h-49Z" fill="${c}" fill-opacity=".88" ${common}/>
          <path d="M403 82h111l53 53-136 136-83-83 55-106Z" fill="${d}" fill-opacity=".17" ${common}/>
          <circle cx="430" cy="120" r="17" fill="${d}"/>
        </g>`;
    case "new-arrivals":
    default:
      return `
        <g transform="translate(1080 55)" filter="url(#shadow)">
          <path d="m57 134 172-94 172 94-172 95L57 134Z" fill="${c}" fill-opacity=".78" ${common}/>
          <path d="M57 134v151l172 94 172-94V134M229 229v150" fill="${d}" fill-opacity=".1" ${common}/>
          <path d="M464 42v72M428 78h72M500 169v45M478 192h45" ${common}/>
        </g>`;
  }
}

function svgArtwork(template) {
  const { a, b, c, d } = template.colors;
  const uid = template.id.replace(/[^a-z0-9]/gi, "");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="420" viewBox="0 0 1600 420" fill="none">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1600" y2="420" gradientUnits="userSpaceOnUse">
      <stop stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <linearGradient id="panel-${uid}" x1="0" y1="0" x2="780" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#000000" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow-${uid}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1260 200) rotate(90) scale(220 260)">
      <stop stop-color="${c}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000000" flood-opacity=".22"/>
    </filter>
  </defs>

  <rect width="1600" height="420" fill="url(#bg-${uid})"/>
  <rect width="780" height="420" fill="url(#panel-${uid})"/>
  <circle cx="1260" cy="200" r="260" fill="url(#glow-${uid})"/>

  <g opacity="0.22" fill="${d}">
    <circle cx="1180" cy="70" r="78"/>
    <circle cx="1460" cy="330" r="120"/>
    <circle cx="1380" cy="90" r="36"/>
  </g>

  ${categoryObjectSvg(template)}

  <path d="M0 0 H16 V420 H0 Z" fill="${c}"/>
  <path d="M1480 40 L1560 90 L1480 140 Z" fill="${c}" fill-opacity="0.9"/>
  <path d="M1510 250c28-8 48-30 48-58 0 0-34 10-48 30-14 20-14 28 0 28Z" fill="${d}" fill-opacity="0.25"/>
</svg>`.trim();
}

export function getBannerTemplateSvg(template) {
  return svgArtwork(template);
}

export function getBannerTemplatePreviewDataUrl(template) {
  const svg = getBannerTemplateSvg(template);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Convert SVG template artwork into a PNG File for Cloudinary upload. */
export function createBannerTemplateImageFile(template) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgUrl = getBannerTemplatePreviewDataUrl(template);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1600;
        canvas.height = 420;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 1600, 420);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create template image."));
              return;
            }
            resolve(
              new File([blob], `${template.id}-brand-banner.png`, {
                type: "image/png",
              })
            );
          },
          "image/png",
          0.95
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Could not load SVG template."));
    img.src = svgUrl;
  });
}
