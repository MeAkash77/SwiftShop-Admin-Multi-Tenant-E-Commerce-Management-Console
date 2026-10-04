/**
 * Server-side pricing — never trust client unit prices.
 * Mirrors frontend/src/utils/productDisplay.js rules.
 */

export function getProductPricing(product) {
  const list = Number(product?.price) || 0;
  const sale = Number(product?.discountPrice) || 0;
  const hasDiscount = sale > 0 && list > 0 && sale < list;
  const price = hasDiscount ? sale : sale > 0 ? sale : list;
  const mrp = hasDiscount ? list : list || price;
  const offer =
    mrp > price && price > 0 ? Math.max(1, Math.round(((mrp - price) / mrp) * 100)) : 0;
  return { price, mrp: mrp || price, offer };
}

export function getVariantPricing(product, variant) {
  if (!variant) return getProductPricing(product);

  const base = getProductPricing(product);
  const vMrp = Number(variant.price) || 0;
  const vSell = Number(variant.discountPrice) || 0;

  if (!vMrp && !vSell) return base;

  return getProductPricing({
    price: vMrp || product?.price || vSell,
    discountPrice: vSell || undefined,
  });
}

/** Normalize selected option keys from cart/checkout payload */
export function normalizeVariantOptions(raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = String(key || "").trim();
    const v = String(value ?? "").trim();
    if (k && v) out[k] = v;
  }
  return out;
}

export function findMatchingVariant(variants = [], selected = {}) {
  if (!Array.isArray(variants) || !variants.length) return null;
  const keys = Object.keys(selected).filter((k) => selected[k]);
  if (!keys.length) return variants[0];

  return (
    variants.find((v) =>
      keys.every((k) => String(v[k] || "") === String(selected[k]))
    ) || null
  );
}

export function findMatchingVariantIndex(variants = [], selected = {}) {
  if (!Array.isArray(variants) || !variants.length) return -1;
  const keys = Object.keys(selected).filter((k) => selected[k]);
  if (!keys.length) return 0;

  return variants.findIndex((v) =>
    keys.every((k) => String(v[k] || "") === String(selected[k]))
  );
}

export function productHasSelectableOptions(product) {
  return (product?.optionGroups || []).some(
    (g) => Array.isArray(g.values) && g.values.length > 0
  );
}

/**
 * Resolve the sell unit price + matched variant for an order line.
 * Throws Error with a customer-facing message on invalid selection.
 */
export function resolveOrderLinePricing(product, rawOptions) {
  const options = normalizeVariantOptions(rawOptions);
  const hasOptions = productHasSelectableOptions(product);

  if (hasOptions) {
    for (const group of product.optionGroups || []) {
      if (!group.values?.length) continue;
      const chosen = options[group.key];
      if (!chosen) {
        throw new Error(
          `Select ${group.label || group.key} for ${product.name}.`
        );
      }
      const allowed = group.values.some(
        (v) => String(v).toLowerCase() === String(chosen).toLowerCase()
      );
      if (!allowed) {
        throw new Error(
          `Invalid ${group.label || group.key} "${chosen}" for ${product.name}.`
        );
      }
      // Canonicalize to catalog value casing
      const canon = group.values.find(
        (v) => String(v).toLowerCase() === String(chosen).toLowerCase()
      );
      options[group.key] = canon;
    }

    const variant = findMatchingVariant(product.variants || [], options);
    if (!variant) {
      throw new Error(
        `Selected options are unavailable for ${product.name}.`
      );
    }

    const pricing = getVariantPricing(product, variant);
    if (!pricing.price || pricing.price <= 0) {
      throw new Error(`Invalid price configured for ${product.name}.`);
    }

    return {
      unitPrice: pricing.price,
      mrp: pricing.mrp,
      options,
      variant,
      variantLabel: Object.values(options).filter(Boolean).join(" / "),
      availableStock: Number(variant.stock) || 0,
    };
  }

  const pricing = getProductPricing(product);
  if (!pricing.price || pricing.price <= 0) {
    throw new Error(`Invalid price configured for ${product.name}.`);
  }

  return {
    unitPrice: pricing.price,
    mrp: pricing.mrp,
    options: {},
    variant: null,
    variantLabel: "",
    availableStock: Number(product.stock) || 0,
  };
}

export function sumVariantStock(product) {
  const variants = product?.variants || [];
  if (!variants.length) return Number(product?.stock) || 0;
  const hasOptionStock = variants.some((v) =>
    ["color", "size", "storage", "ram", "capacity", "connectivity", "chipset"].some(
      (k) => v[k]
    )
  );
  if (!hasOptionStock && variants.length === 1) {
    return Number(variants[0].stock ?? product.stock) || 0;
  }
  return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}
