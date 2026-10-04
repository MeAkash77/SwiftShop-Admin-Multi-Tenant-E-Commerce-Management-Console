/**
 * Product-type templates drive vendor forms and customer option pickers.
 * Each type shows different options + specs (cloth ≠ laptop ≠ furniture).
 * presets = company quick-picks so vendors can click instead of typing.
 */
export const PRODUCT_TYPES = [
  { id: "generic", label: "General product", hint: "Basic color / size" },
  { id: "fashion", label: "Fashion / Cloth", hint: "Size, color, fabric" },
  { id: "mobile", label: "Mobile / Smartphone", hint: "Storage, RAM, camera" },
  { id: "laptop", label: "Laptop", hint: "SSD, RAM, processor" },
  { id: "tablet", label: "Tablet", hint: "Storage, Wi-Fi / Cellular" },
  { id: "furniture", label: "Furniture", hint: "Material, dimensions, color" },
  { id: "appliance", label: "Home appliance", hint: "Capacity, energy rating" },
  { id: "electronics", label: "Electronics / Accessories", hint: "Connectivity, battery" },
];

/** Map category slug / name keywords → default product type */
export function suggestProductTypeFromCategory(category) {
  const hay = `${category?.slug || ""} ${category?.name || ""}`.toLowerCase();
  if (!hay.trim()) return null;
  if (/fashion|cloth|apparel|wear|dress|shirt|kurta|shoe|footwear/.test(hay))
    return "fashion";
  if (/mobile|phone|smartphone/.test(hay)) return "mobile";
  if (/laptop|notebook|computer/.test(hay)) return "laptop";
  if (/tablet|ipad/.test(hay)) return "tablet";
  if (/furniture|sofa|chair|table|bed|furnitur|home.?decor|furnishing/.test(hay))
    return "furniture";
  if (/appliance|washing|fridge|ac\b|microwave|kitchen/.test(hay))
    return "appliance";
  if (/electronic|audio|headphone|earbud|gadget|accessor/.test(hay))
    return "electronics";
  if (/home/.test(hay)) return "furniture";
  return null;
}

const templates = {
  generic: {
    optionKeys: [
      {
        key: "color",
        label: "Color",
        placeholder: "Black, Blue, Silver",
        presets: ["Black", "White", "Blue", "Red", "Grey", "Green"],
      },
      {
        key: "size",
        label: "Size",
        placeholder: "S, M, L, XL",
        presets: ["S", "M", "L", "XL", "XXL", "One Size"],
      },
    ],
    specFields: [
      { key: "Material", placeholder: "e.g. Cotton" },
      { key: "Weight", placeholder: "e.g. 200 g" },
      { key: "Warranty", placeholder: "e.g. 1 year" },
    ],
  },
  fashion: {
    optionKeys: [
      {
        key: "color",
        label: "Color",
        placeholder: "Black, Navy, Olive",
        presets: ["Black", "White", "Navy", "Olive", "Beige", "Red", "Grey", "Maroon"],
      },
      {
        key: "size",
        label: "Size",
        placeholder: "S, M, L, XL, XXL",
        presets: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      },
    ],
    specFields: [
      { key: "Material / Fabric", placeholder: "e.g. 100% Cotton, Denim" },
      { key: "Fit", placeholder: "e.g. Regular / Slim / Oversized" },
      { key: "Pattern", placeholder: "e.g. Solid / Printed / Striped" },
      { key: "Sleeve / Length", placeholder: "e.g. Full sleeve / Ankle length" },
      { key: "Care", placeholder: "e.g. Machine wash cold" },
      { key: "Occasion", placeholder: "e.g. Casual / Formal / Party" },
      { key: "Country of Origin", placeholder: "e.g. India" },
    ],
  },
  mobile: {
    optionKeys: [
      {
        key: "color",
        label: "Color",
        placeholder: "Black, Blue, Gold",
        presets: ["Black", "Blue", "Gold", "Silver", "Green", "White"],
      },
      {
        key: "storage",
        label: "Storage",
        placeholder: "128GB, 256GB, 512GB",
        presets: ["64GB", "128GB", "256GB", "512GB", "1TB"],
      },
      {
        key: "ram",
        label: "RAM",
        placeholder: "6GB, 8GB, 12GB",
        presets: ["4GB", "6GB", "8GB", "12GB", "16GB"],
      },
    ],
    specFields: [
      { key: "Processor / Chipset", placeholder: "e.g. Snapdragon 8 Gen 3" },
      { key: "Display", placeholder: "e.g. 6.7 inch AMOLED, 120Hz" },
      { key: "Battery", placeholder: "e.g. 5000 mAh" },
      { key: "Camera", placeholder: "e.g. 50MP + 12MP" },
      { key: "OS", placeholder: "e.g. Android 15" },
      { key: "Network", placeholder: "e.g. 5G" },
      { key: "SIM", placeholder: "e.g. Dual SIM" },
      { key: "Warranty", placeholder: "e.g. 1 year" },
    ],
  },
  laptop: {
    optionKeys: [
      {
        key: "color",
        label: "Color",
        placeholder: "Silver, Space Grey",
        presets: ["Silver", "Space Grey", "Black", "White"],
      },
      {
        key: "storage",
        label: "SSD Storage",
        placeholder: "512GB, 1TB",
        presets: ["256GB", "512GB", "1TB", "2TB"],
      },
      {
        key: "ram",
        label: "RAM",
        placeholder: "16GB, 32GB",
        presets: ["8GB", "16GB", "32GB", "64GB"],
      },
    ],
    specFields: [
      { key: "Processor / Chipset", placeholder: "e.g. Intel Core Ultra 7 / Apple M3" },
      { key: "Graphics", placeholder: "e.g. Integrated / RTX 4050" },
      { key: "Display", placeholder: "e.g. 14 inch 2.8K OLED" },
      { key: "Battery", placeholder: "e.g. Up to 18 hours" },
      { key: "OS", placeholder: "e.g. Windows 11 / macOS" },
      { key: "Ports", placeholder: "e.g. 2x USB-C, HDMI" },
      { key: "Weight", placeholder: "e.g. 1.4 kg" },
      { key: "Warranty", placeholder: "e.g. 1 year" },
    ],
  },
  tablet: {
    optionKeys: [
      {
        key: "color",
        label: "Color",
        placeholder: "Silver, Space Black",
        presets: ["Silver", "Space Black", "Blue", "Pink"],
      },
      {
        key: "storage",
        label: "Storage",
        placeholder: "128GB, 256GB, 512GB",
        presets: ["64GB", "128GB", "256GB", "512GB", "1TB"],
      },
      {
        key: "connectivity",
        label: "Connectivity",
        placeholder: "Wi-Fi, Wi-Fi + Cellular",
        presets: ["Wi-Fi", "Wi-Fi + Cellular"],
      },
    ],
    specFields: [
      { key: "Processor / Chipset", placeholder: "e.g. Apple A17 Pro / Snapdragon" },
      { key: "Display", placeholder: "e.g. 11 inch Liquid Retina" },
      { key: "RAM", placeholder: "e.g. 8GB" },
      { key: "Battery", placeholder: "e.g. Up to 10 hours" },
      { key: "OS", placeholder: "e.g. iPadOS / Android" },
      { key: "Stylus support", placeholder: "e.g. Apple Pencil / S Pen" },
      { key: "Warranty", placeholder: "e.g. 1 year" },
    ],
  },
  furniture: {
    optionKeys: [
      {
        key: "color",
        label: "Color / Finish",
        placeholder: "Walnut, Oak, White",
        presets: ["Walnut", "Oak", "Teak", "White", "Black", "Grey", "Natural"],
      },
      {
        key: "size",
        label: "Size / Seating",
        placeholder: "1 Seater, 3 Seater, Queen",
        presets: ["1 Seater", "2 Seater", "3 Seater", "Single", "Queen", "King"],
      },
    ],
    specFields: [
      { key: "Material", placeholder: "e.g. Solid wood / Engineered wood / Metal" },
      { key: "Dimensions (L×W×H)", placeholder: "e.g. 180 × 90 × 75 cm" },
      { key: "Weight capacity", placeholder: "e.g. 120 kg" },
      { key: "Assembly", placeholder: "e.g. DIY / Carpenter required" },
      { key: "Room type", placeholder: "e.g. Living room / Bedroom" },
      { key: "Style", placeholder: "e.g. Modern / Traditional" },
      { key: "Warranty", placeholder: "e.g. 1 year" },
    ],
  },
  appliance: {
    optionKeys: [
      {
        key: "color",
        label: "Color / Finish",
        placeholder: "White, Silver",
        presets: ["White", "Silver", "Black", "Steel"],
      },
      {
        key: "capacity",
        label: "Capacity",
        placeholder: "7kg, 8kg, 1.5 Ton",
        presets: ["6kg", "7kg", "8kg", "1 Ton", "1.5 Ton", "2 Ton"],
      },
    ],
    specFields: [
      { key: "Power", placeholder: "e.g. 220-240V" },
      { key: "Energy Rating", placeholder: "e.g. 5 Star" },
      { key: "Dimensions", placeholder: "e.g. 60 x 55 x 85 cm" },
      { key: "Noise level", placeholder: "e.g. 45 dB" },
      { key: "Warranty", placeholder: "e.g. 2 years" },
    ],
  },
  electronics: {
    optionKeys: [
      {
        key: "color",
        label: "Color",
        placeholder: "Black, White",
        presets: ["Black", "White", "Blue", "Red"],
      },
      {
        key: "size",
        label: "Size / Variant",
        placeholder: "Standard, Pro",
        presets: ["Standard", "Pro", "Max", "Mini"],
      },
    ],
    specFields: [
      { key: "Connectivity", placeholder: "e.g. Bluetooth 5.3, USB-C" },
      { key: "Battery", placeholder: "e.g. 30 hours" },
      { key: "Compatibility", placeholder: "e.g. Android, iOS, Windows" },
      { key: "Warranty", placeholder: "e.g. 1 year" },
    ],
  },
};

export function getProductTypeTemplate(typeId = "generic") {
  return templates[typeId] || templates.generic;
}

/** Parse "a, b, c" into clean unique values */
export function parseOptionValues(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(
      (v, i, arr) =>
        arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i
    );
}

/** Cartesian product of option groups → variant skeleton rows */
export function buildVariantCombos(optionGroups = []) {
  const groups = optionGroups.filter((g) => g.values?.length);
  if (!groups.length) return [{ stock: 0 }];

  return groups.reduce(
    (acc, group) => {
      const next = [];
      for (const row of acc) {
        for (const value of group.values) {
          next.push({ ...row, [group.key]: value, stock: row.stock ?? 0 });
        }
      }
      return next;
    },
    [{}]
  );
}

export function findMatchingVariant(variants = [], selected = {}) {
  if (!variants.length) return null;
  const keys = Object.keys(selected).filter((k) => selected[k]);
  if (!keys.length) return variants[0];

  return (
    variants.find((v) =>
      keys.every((k) => String(v[k] || "") === String(selected[k]))
    ) || null
  );
}
