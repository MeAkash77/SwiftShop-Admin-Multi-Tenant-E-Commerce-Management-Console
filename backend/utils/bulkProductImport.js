import XLSX from "xlsx";
import { PRODUCT_TYPE_IDS } from "./productTypeTemplates.js";

export const BULK_HEADERS = [
  "name",
  "description",
  "shortDescription",
  "brand",
  "productType",
  "categorySlug",
  "price",
  "discountPrice",
  "stock",
  "status",
  "color",
  "size",
  "storage",
  "ram",
  "capacity",
  "connectivity",
  "chipset",
  "aboutItems",
  "specifications",
  "tags",
  "imageUrls",
];

export const OPTION_COLUMNS = [
  { col: "color", key: "color", label: "Color" },
  { col: "size", key: "size", label: "Size" },
  { col: "storage", key: "storage", label: "Storage" },
  { col: "ram", key: "ram", label: "RAM" },
  { col: "capacity", key: "capacity", label: "Capacity" },
  { col: "connectivity", key: "connectivity", label: "Connectivity" },
  { col: "chipset", key: "chipset", label: "Chipset" },
];

const SAMPLE_ROWS = [
  {
    name: "Galaxy Phone X",
    description: "Flagship smartphone with AMOLED display and fast charging.",
    shortDescription: "5G smartphone",
    brand: "Samsung",
    productType: "mobile",
    categorySlug: "electronics",
    price: 79999,
    discountPrice: 69999,
    stock: 10,
    status: "active",
    color: "Black, Blue",
    size: "",
    storage: "128GB, 256GB",
    ram: "8GB",
    capacity: "",
    connectivity: "",
    chipset: "",
    aboutItems: "120Hz AMOLED display|5000 mAh battery|5G ready",
    specifications: "Battery:5000 mAh|OS:Android 15|Network:5G",
    tags: "phone,5g",
    imageUrls: "",
  },
  {
    name: "Cotton Crew T-Shirt",
    description: "Soft cotton tee for everyday wear.",
    shortDescription: "Everyday tee",
    brand: "Basics",
    productType: "fashion",
    categorySlug: "fashion",
    price: 999,
    discountPrice: 699,
    stock: 25,
    status: "active",
    color: "White, Black",
    size: "S, M, L, XL",
    storage: "",
    ram: "",
    capacity: "",
    connectivity: "",
    chipset: "",
    aboutItems: "100% cotton|Regular fit|Machine wash",
    specifications: "Material:Cotton|Fit:Regular",
    tags: "apparel,tshirt",
    imageUrls: "",
  },
];

function cell(value) {
  if (value == null) return "";
  return String(value).trim();
}

export function splitList(value, separators = /[,;]/) {
  return cell(value)
    .split(separators)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(
      (v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i
    );
}

export function splitPiped(value) {
  return cell(value)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseSpecifications(raw) {
  return splitPiped(raw)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return null;
      return {
        label: pair.slice(0, idx).trim(),
        value: pair.slice(idx + 1).trim(),
      };
    })
    .filter((row) => row && row.label && row.value);
}

export function ensureHtmlDescription(text) {
  const raw = cell(text);
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

export function buildOptionGroups(row) {
  return OPTION_COLUMNS.map(({ col, key, label }) => {
    const values = splitList(row[col]);
    return values.length ? { key, label, values } : null;
  }).filter(Boolean);
}

export function buildVariantCombos(optionGroups = [], base = {}) {
  const groups = optionGroups.filter((g) => g.values?.length);
  const stock = Number(base.stock) || 0;
  const price =
    base.price != null && base.price !== "" ? Number(base.price) : undefined;
  const discountPrice =
    base.discountPrice != null && base.discountPrice !== ""
      ? Number(base.discountPrice)
      : undefined;

  if (!groups.length) {
    return [
      {
        stock,
        ...(price != null && !Number.isNaN(price) ? { price } : {}),
        ...(discountPrice != null && !Number.isNaN(discountPrice)
          ? { discountPrice }
          : {}),
      },
    ];
  }

  return groups.reduce(
    (acc, group) => {
      const next = [];
      for (const row of acc) {
        for (const value of group.values) {
          next.push({
            ...row,
            [group.key]: value,
            stock: row.stock ?? 0,
          });
        }
      }
      return next;
    },
    [
      {
        stock,
        ...(price != null && !Number.isNaN(price) ? { price } : {}),
        ...(discountPrice != null && !Number.isNaN(discountPrice)
          ? { discountPrice }
          : {}),
      },
    ]
  );
}

export function parseImageUrls(raw) {
  return splitList(raw)
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 8)
    .map((url, i) => ({
      public_id: `bulk_import_${Date.now()}_${i}`,
      url,
    }));
}

export function normalizeHeaderKey(key) {
  return String(key || "")
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES = {
  name: "name",
  productname: "name",
  description: "description",
  shortdescription: "shortDescription",
  brand: "brand",
  producttype: "productType",
  type: "productType",
  categoryslug: "categorySlug",
  category: "categorySlug",
  categoryname: "categorySlug",
  price: "price",
  mrp: "price",
  discountprice: "discountPrice",
  sellingprice: "discountPrice",
  stock: "stock",
  qty: "stock",
  quantity: "stock",
  status: "status",
  color: "color",
  colors: "color",
  size: "size",
  sizes: "size",
  storage: "storage",
  storages: "storage",
  ram: "ram",
  rams: "ram",
  capacity: "capacity",
  capacities: "capacity",
  connectivity: "connectivity",
  chipset: "chipset",
  aboutitems: "aboutItems",
  about: "aboutItems",
  specifications: "specifications",
  specs: "specifications",
  tags: "tags",
  imageurls: "imageUrls",
  images: "imageUrls",
};

export function mapRowKeys(rawRow = {}) {
  const mapped = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const alias = HEADER_ALIASES[normalizeHeaderKey(key)];
    if (alias) mapped[alias] = value;
  }
  return mapped;
}

export function rowsFromWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  return rows.map(mapRowKeys).filter((row) => Object.values(row).some((v) => cell(v)));
}

export function buildTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const data = [BULK_HEADERS, ...SAMPLE_ROWS.map((row) => BULK_HEADERS.map((h) => row[h] ?? ""))];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!cols"] = BULK_HEADERS.map((h) => ({
    wch: Math.min(28, Math.max(12, h.length + 4)),
  }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");

  const guide = XLSX.utils.aoa_to_sheet([
    ["Column", "Required", "How to fill"],
    ["name", "Yes", "Product title"],
    ["description", "Yes", "Plain text or HTML; plain text becomes paragraphs"],
    ["shortDescription", "No", "One-line summary"],
    ["brand", "No", "Brand name"],
    ["productType", "No", PRODUCT_TYPE_IDS.join(" | ")],
    ["categorySlug", "Yes*", "Category slug or exact category name (*required)"],
    ["price", "Yes", "MRP / list price"],
    ["discountPrice", "No", "Selling price"],
    ["stock", "No", "Stock applied to every version combination"],
    ["status", "No", "active or inactive (default active)"],
    ["color / size / storage / …", "No", "Comma-separated options; versions are auto-generated"],
    ["aboutItems", "No", "Bullets separated by |"],
    ["specifications", "No", "Label:Value pairs separated by |"],
    ["tags", "No", "Comma-separated tags"],
    ["imageUrls", "No", "Comma-separated https image URLs (optional)"],
    ["", "", "Delete sample rows before uploading your products."],
  ]);
  XLSX.utils.book_append_sheet(workbook, guide, "Instructions");
  return workbook;
}

export function templateBuffer(format = "xlsx") {
  const workbook = buildTemplateWorkbook();
  if (format === "csv") {
    const sheet = workbook.Sheets.Products;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return Buffer.from(csv, "utf8");
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function validateProductType(type) {
  const value = cell(type).toLowerCase() || "generic";
  return PRODUCT_TYPE_IDS.includes(value) ? value : null;
}
