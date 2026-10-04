import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { categoryApi, productApi, storeApi } from "../../api/services";
import RichTextEditor from "../../components/editor/RichTextEditor";
import MediaPickerModal from "../../components/shop/MediaPickerModal";
import CatalogPickerModal from "../../components/shop/CatalogPickerModal";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { notify } from "../../utils/notify";
import { htmlToPlainPreview } from "../../utils/sanitizeHtml";
import {
  PRODUCT_TYPES,
  buildVariantCombos,
  getProductTypeTemplate,
  parseOptionValues,
  suggestProductTypeFromCategory,
} from "../../utils/productTypeTemplates";

const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Description" },
  { id: 3, label: "Models" },
  { id: 4, label: "Specs & photos" },
];

const emptyForm = () => ({
  name: "",
  description: "",
  shortDescription: "",
  price: "",
  discountPrice: "",
  stock: "",
  brand: "",
  category: "",
  productType: "generic",
  status: "active",
  aboutText: "",
  optionInputs: {},
  optionDrafts: {},
  specInputs: {},
  extraSpecs: [{ label: "", value: "" }],
  variants: [{ stock: 0 }],
});

function OptionTagInput({
  label,
  placeholder,
  values,
  draft,
  onDraft,
  onAdd,
  onRemove,
  presets = [],
  onTogglePreset,
}) {
  return (
    <div className="vp-option-field">
      <div className="vp-option-head">
        <strong>{label}</strong>
        <span>{values.length} options</span>
      </div>
      {presets.length ? (
        <div className="vp-preset-chips">
          {presets.map((preset) => {
            const on = values.some(
              (v) => v.toLowerCase() === preset.toLowerCase()
            );
            return (
              <button
                key={preset}
                type="button"
                className={`vp-preset-chip${on ? " is-on" : ""}`}
                onClick={() => onTogglePreset?.(preset)}
              >
                {preset}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="vp-tags">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className="vp-tag"
            onClick={() => onRemove(value)}
            title="Remove"
          >
            {value} <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="vp-tag-add">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button type="button" className="vp-btn vp-btn-ghost" onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

const VendorProducts = () => {
  const user = useSelector((state) => state.user.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [managingId, setManagingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [step, setStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderedImages, setOrderedImages] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [galleryPicked, setGalleryPicked] = useState([]);
  const [initialImageIds, setInitialImageIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [prefillBanner, setPrefillBanner] = useState("");

  const template = useMemo(
    () => getProductTypeTemplate(form.productType),
    [form.productType],
  );

  const activeTypeMeta = useMemo(
    () => PRODUCT_TYPES.find((t) => t.id === form.productType) || PRODUCT_TYPES[0],
    [form.productType]
  );

  async function loadProducts() {
    const response = await productApi.vendorList();
    setProducts(response.data || []);
  }

  useEffect(() => {
    async function load() {
      try {
        const [storeRes, catRes] = await Promise.all([
          storeApi.getByVendor(user.id),
          categoryApi.list(),
        ]);
        setStore(storeRes.data.data);
        const cats = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.data || [];
        setCategories(cats);
        await loadProducts();
      } catch (err) {
        notify.fromError(err, "Create your store before adding products.");
      }
    }
    if (user?.id) load();
  }, [user?.id]);

  useEffect(() => {
    setForm((prev) => {
      const optionInputs = { ...prev.optionInputs };
      const optionDrafts = { ...prev.optionDrafts };
      const specInputs = { ...prev.specInputs };
      for (const opt of template.optionKeys) {
        if (optionInputs[opt.key] == null) optionInputs[opt.key] = "";
        if (optionDrafts[opt.key] == null) optionDrafts[opt.key] = "";
      }
      for (const spec of template.specFields) {
        if (specInputs[spec.key] == null) specInputs[spec.key] = "";
      }
      return { ...prev, optionInputs, optionDrafts, specInputs };
    });
  }, [template]);

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "category") {
      const cat = categories.find((c) => String(c._id) === String(value));
      const suggested = suggestProductTypeFromCategory(cat);
      if (suggested && suggested !== form.productType) {
        const nextTemplate = getProductTypeTemplate(suggested);
        const optionInputs = {};
        const optionDrafts = {};
        const specInputs = {};
        nextTemplate.optionKeys.forEach((o) => {
          optionInputs[o.key] = "";
          optionDrafts[o.key] = "";
        });
        nextTemplate.specFields.forEach((s) => {
          specInputs[s.key] = "";
        });
        setForm((prev) => ({
          ...prev,
          category: value,
          productType: suggested,
          optionInputs,
          optionDrafts,
          specInputs,
          variants: [{ stock: Number(prev.stock) || 0 }],
        }));
        notify.info(
          `Fields switched to ${
            PRODUCT_TYPES.find((t) => t.id === suggested)?.label || suggested
          }.`
        );
      } else {
        setForm((prev) => ({ ...prev, category: value }));
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function togglePreset(key, value) {
    const current = getOptionValues(key);
    const exists = current.some((v) => v.toLowerCase() === value.toLowerCase());
    const next = exists
      ? current.filter((v) => v.toLowerCase() !== value.toLowerCase())
      : [...current, value];
    setOptionValues(key, next);
  }

  function changeProductType(type) {
    const nextTemplate = getProductTypeTemplate(type);
    const optionInputs = {};
    const optionDrafts = {};
    const specInputs = {};
    nextTemplate.optionKeys.forEach((o) => {
      optionInputs[o.key] = "";
      optionDrafts[o.key] = "";
    });
    nextTemplate.specFields.forEach((s) => {
      specInputs[s.key] = "";
    });
    setForm((prev) => ({
      ...prev,
      productType: type,
      optionInputs,
      optionDrafts,
      specInputs,
      variants: [{ stock: Number(prev.stock) || 0 }],
    }));
  }

  function getOptionValues(key) {
    return parseOptionValues(form.optionInputs[key]);
  }

  function setOptionValues(key, values) {
    setForm((prev) => ({
      ...prev,
      optionInputs: {
        ...prev.optionInputs,
        [key]: values.join(", "),
      },
    }));
  }

  function addOptionValue(key) {
    const draft = String(form.optionDrafts[key] || "").trim();
    if (!draft) return;
    const values = getOptionValues(key);
    if (values.some((v) => v.toLowerCase() === draft.toLowerCase())) {
      notify.info("That option already exists.");
      return;
    }
    setOptionValues(key, [...values, draft]);
    setForm((prev) => ({
      ...prev,
      optionDrafts: { ...prev.optionDrafts, [key]: "" },
    }));
  }

  function removeOptionValue(key, value) {
    setOptionValues(
      key,
      getOptionValues(key).filter((v) => v !== value),
    );
  }

  function rebuildVariants() {
    const optionGroups = template.optionKeys
      .map((o) => ({
        key: o.key,
        label: o.label,
        values: getOptionValues(o.key),
      }))
      .filter((g) => g.values.length);

    const baseMrp = form.price !== "" ? Number(form.price) : "";
    const baseSell =
      form.discountPrice !== "" ? Number(form.discountPrice) : "";

    const combos = buildVariantCombos(optionGroups).map((row) => {
      const existing = form.variants.find((v) =>
        optionGroups.every(
          (g) => String(v[g.key] || "") === String(row[g.key] || ""),
        ),
      );
      return {
        ...row,
        stock: existing?.stock ?? 0,
        price: existing?.price ?? baseMrp,
        discountPrice: existing?.discountPrice ?? baseSell,
      };
    });

    setForm((prev) => ({
      ...prev,
      variants: combos.length
        ? combos
        : [
            {
              stock: Number(prev.stock) || 0,
              price: baseMrp,
              discountPrice: baseSell,
            },
          ],
    }));
    notify.success(
      combos.length
        ? `${combos.length} versions ready — set MRP, selling price & stock for each.`
        : "No versions yet — add color/storage first.",
    );
  }

  function updateVariantField(index, field, value) {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  }

  function applyBasePriceToAllVersions() {
    const baseMrp = form.price !== "" ? Number(form.price) : "";
    const baseSell =
      form.discountPrice !== "" ? Number(form.discountPrice) : "";
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        price: baseMrp,
        discountPrice: baseSell,
      })),
    }));
    notify.info("Applied base MRP / selling price to all versions.");
  }

  function resetForm() {
    setForm(emptyForm());
    setImages([]);
    setGalleryPicked([]);
    setInitialImageIds([]);
    setEditingId(null);
    setStep(1);
    setPrefillBanner("");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
    setManagingId(null);
  }

  function prefillFromCatalog(item) {
    const type = item.productType || "generic";
    const tmpl = getProductTypeTemplate(type);
    const matchedCategory =
      categories.find(
        (c) =>
          String(c._id) === String(item.category?._id || item.category) ||
          (c.slug && c.slug === item.categorySlug)
      ) || null;

    const optionInputs = {};
    const optionDrafts = {};
    tmpl.optionKeys.forEach((o) => {
      optionInputs[o.key] = "";
      optionDrafts[o.key] = "";
    });
    (item.optionGroups || []).forEach((g) => {
      if (!g.key) return;
      optionInputs[g.key] = (g.values || []).join(", ");
      optionDrafts[g.key] = optionDrafts[g.key] || "";
    });

    const specInputs = {};
    tmpl.specFields.forEach((s) => {
      specInputs[s.key] = "";
    });
    // Match catalog specs to template fields by key OR human placeholder
    // (case-insensitive). Anything that doesn't match a template field is kept
    // as a custom "extra" spec so it is not dropped when the vendor publishes.
    const extraSpecs = [];
    (item.specifications || []).forEach((row) => {
      const label = String(row.label || "").trim();
      if (!label) return;
      const field = tmpl.specFields.find(
        (s) =>
          s.key.toLowerCase() === label.toLowerCase() ||
          String(s.placeholder || "").toLowerCase() === label.toLowerCase()
      );
      if (field) {
        specInputs[field.key] = row.value || "";
      } else {
        extraSpecs.push({ label, value: row.value || "" });
      }
    });
    extraSpecs.push({ label: "", value: "" });

    const optionGroups = (item.optionGroups || []).filter(
      (g) => g.key && g.values?.length
    );
    const baseMrp = item.suggestedPrice ?? "";
    const baseSell = item.suggestedDiscountPrice ?? "";
    const variants = buildVariantCombos(optionGroups).map((row) => ({
      ...row,
      stock: 1,
      price: baseMrp,
      discountPrice: baseSell,
    }));

    setEditingId(null);
    setInitialImageIds([]);
    setImages([]);
    setGalleryPicked(
      (item.images || [])
        .filter((img) => img?.url)
        .map((img) => ({
          public_id: img.public_id || img.url,
          url: img.url,
        }))
        .slice(0, 8)
    );
    setForm({
      name: item.name || "",
      description: item.description || "",
      shortDescription: item.shortDescription || "",
      price: baseMrp,
      discountPrice: baseSell,
      stock: "1",
      brand: item.brand || "",
      category: matchedCategory?._id || "",
      productType: type,
      status: "active",
      aboutText: (item.aboutItems || []).join("\n"),
      optionInputs,
      optionDrafts,
      specInputs,
      extraSpecs,
      variants: variants.length ? variants : [{ stock: 1, price: baseMrp, discountPrice: baseSell }],
    });
    setShowForm(true);
    setManagingId(null);
    setStep(1);
    setPrefillBanner(
      `Loaded "${item.brand} ${item.name}". Review type-specific models & specs, then publish.`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!store?._id) {
      notify.warning("Create a store first.");
      return;
    }
    if (!images.length && !galleryPicked.length) {
      notify.warning(
        "Add at least one photo (upload or Media library) in step 4.",
      );
      setStep(4);
      return;
    }
    const plain = htmlToPlainPreview(form.description, 20);
    if (!plain || plain === "…") {
      notify.warning("Please write a product description.");
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      let workingVariants = form.variants;
      const optionGroupsPreview = template.optionKeys
        .map((o) => ({
          key: o.key,
          label: o.label,
          values: getOptionValues(o.key),
        }))
        .filter((g) => g.values.length);
      if (optionGroupsPreview.length) {
        const combos = buildVariantCombos(optionGroupsPreview).map((row) => {
          const existing = workingVariants.find((v) =>
            optionGroupsPreview.every(
              (g) => String(v[g.key] || "") === String(row[g.key] || ""),
            ),
          );
          return {
            ...row,
            stock: existing?.stock ?? 0,
            price: existing?.price,
          };
        });
        workingVariants = combos.length ? combos : workingVariants;
      }

      const aboutItems = String(form.aboutText || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const optionGroups = optionGroupsPreview;

      const specifications = [
        ...template.specFields
          .map((s) => ({
            label: s.key,
            value: String(form.specInputs[s.key] || "").trim(),
          }))
          .filter((row) => row.value),
        ...form.extraSpecs
          .map((row) => ({
            label: String(row.label || "").trim(),
            value: String(row.value || "").trim(),
          }))
          .filter((row) => row.label && row.value),
      ];

      const variants = (workingVariants || []).map((v) => ({
        ...v,
        stock: Number(v.stock) || 0,
        price: v.price !== "" && v.price != null ? Number(v.price) : undefined,
        discountPrice:
          v.discountPrice !== "" && v.discountPrice != null
            ? Number(v.discountPrice)
            : undefined,
      }));
      const stock =
        variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) ||
        Number(form.stock) ||
        0;

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("shortDescription", form.shortDescription || "");
      formData.append("price", form.price);
      if (form.discountPrice !== "")
        formData.append("discountPrice", form.discountPrice);
      formData.append("stock", String(stock));
      formData.append("brand", form.brand || "");
      formData.append("status", form.status);
      formData.append("productType", form.productType);
      formData.append("store", store._id);
      if (form.category) formData.append("category", form.category);
      formData.append("aboutItems", JSON.stringify(aboutItems));
      formData.append("optionGroups", JSON.stringify(optionGroups));
      formData.append("specifications", JSON.stringify(specifications));
      formData.append("variants", JSON.stringify(variants));

      if (galleryPicked.length) {
        const initial = new Set(initialImageIds);
        const newlyAttached = galleryPicked.filter(
          (g) => !initial.has(g.public_id),
        );
        if (newlyAttached.length) {
          formData.append(
            "galleryImages",
            JSON.stringify(newlyAttached.slice(0, 8)),
          );
        }
      }

      if (editingId && initialImageIds.length) {
        const keep = new Set(galleryPicked.map((g) => g.public_id));
        const removed = initialImageIds.filter((id) => !keep.has(id));
        if (removed.length) {
          formData.append("removeImages", JSON.stringify(removed));
        }
      }

      const slotsLeft = Math.max(0, 8 - galleryPicked.length);
      if (!editingId) {
        images
          .slice(0, slotsLeft)
          .forEach((file) => formData.append("images", file));
        if (galleryPicked.length) {
          formData.set(
            "galleryImages",
            JSON.stringify(galleryPicked.slice(0, 8)),
          );
        }
        await productApi.create(formData);
        notify.success("Product published.");
      } else {
        images
          .slice(0, slotsLeft)
          .forEach((file) => formData.append("images", file));
        await productApi.update(editingId, formData);
        notify.success("Product updated.");
      }

      resetForm();
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      notify.fromError(
        err,
        editingId ? "Update failed." : "Failed to create product.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(product) {
    const type = product.productType || "generic";
    const tmpl = getProductTypeTemplate(type);
    const optionInputs = {};
    const optionDrafts = {};
    tmpl.optionKeys.forEach((o) => {
      const found = (product.optionGroups || []).find((g) => g.key === o.key);
      optionInputs[o.key] = found?.values?.join(", ") || "";
      optionDrafts[o.key] = "";
    });
    const specInputs = {};
    tmpl.specFields.forEach((s) => {
      const found = (product.specifications || []).find(
        (row) => row.label === s.key,
      );
      specInputs[s.key] = found?.value || "";
    });
    const knownLabels = new Set(tmpl.specFields.map((s) => s.key));
    const extraSpecs = (product.specifications || [])
      .filter((row) => !knownLabels.has(row.label))
      .map((row) => ({ label: row.label, value: row.value }));

    setEditingId(product._id);
    setShowForm(true);
    setStep(1);
    setManagingId(null);
    setGalleryPicked(
      (product.images || [])
        .filter((img) => img?.public_id && img?.url)
        .map((img) => ({ public_id: img.public_id, url: img.url })),
    );
    setInitialImageIds(
      (product.images || []).map((img) => img.public_id).filter(Boolean),
    );
    setImages([]);
    setForm({
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? "",
      stock: product.stock ?? "",
      brand: product.brand || "",
      category: product.category?._id || product.category || "",
      productType: type,
      status: product.status || "active",
      aboutText: (product.aboutItems || []).join("\n"),
      optionInputs,
      optionDrafts,
      specInputs,
      extraSpecs: extraSpecs.length ? extraSpecs : [{ label: "", value: "" }],
      variants: product.variants?.length
        ? product.variants.map((v) => ({ ...v }))
        : [{ stock: product.stock || 0 }],
    });
    setImages([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || !products.length || editingId === editId) return;
    const product = products.find((p) => String(p._id) === String(editId));
    if (product) {
      startEdit(product);
      setSearchParams({}, { replace: true });
    }
  }, [products, searchParams, editingId, setSearchParams]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await productApi.remove(id);
      notify.success("Product deleted.");
      if (editingId === id) {
        resetForm();
        setShowForm(false);
      }
      await loadProducts();
    } catch (err) {
      notify.fromError(err, "Delete failed");
    }
  }

  async function handleRemoveImage(product, publicId) {
    try {
      const formData = new FormData();
      formData.append("removeImages", JSON.stringify([publicId]));
      await productApi.update(product._id, formData);
      notify.success("Image removed.");
      setOrderedImages((prev) =>
        prev.filter((img) => img.public_id !== publicId),
      );
      await loadProducts();
    } catch (err) {
      notify.fromError(err, "Could not remove image.");
    }
  }

  async function handleAddImages(product) {
    if (!extraImages.length) {
      notify.warning("Choose images to upload.");
      return;
    }
    try {
      const formData = new FormData();
      extraImages.forEach((file) => formData.append("images", file));
      await productApi.update(product._id, formData);
      notify.success("Images added.");
      setExtraImages([]);
      await loadProducts();
    } catch (err) {
      notify.fromError(err, "Image upload failed.");
    }
  }

  function openImageManager(product) {
    setManagingId(product._id);
    setExtraImages([]);
    setShowForm(false);
    setOrderedImages((product.images || []).map((img) => ({ ...img })));
    setDragIndex(null);
    setDropIndex(null);
  }

  function reorderLocal(from, to) {
    if (from == null || to == null || from === to) return orderedImages;
    const next = [...orderedImages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  async function saveImageOrder(productId, images) {
    setReordering(true);
    try {
      const formData = new FormData();
      formData.append(
        "imageOrder",
        JSON.stringify(images.map((img) => img.public_id).filter(Boolean)),
      );
      await productApi.update(productId, formData);
      notify.success("Image order saved. First image is the main photo.");
      await loadProducts();
    } catch (err) {
      notify.fromError(err, "Could not save image order.");
      const product = products.find((p) => p._id === productId);
      setOrderedImages((product?.images || []).map((img) => ({ ...img })));
    } finally {
      setReordering(false);
    }
  }

  async function handleImageDrop(toIndex) {
    if (dragIndex == null || !managingId) return;
    const next = reorderLocal(dragIndex, toIndex);
    setOrderedImages(next);
    setDragIndex(null);
    setDropIndex(null);
    await saveImageOrder(managingId, next);
  }

  // Keep local gallery in sync after uploads / product reload
  useEffect(() => {
    if (!managingId) {
      setOrderedImages([]);
      return;
    }
    const product = products.find((p) => p._id === managingId);
    if (product?.images) {
      setOrderedImages(product.images.map((img) => ({ ...img })));
    }
  }, [products, managingId]);

  const managingProduct = products.find((p) => p._id === managingId);
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(products, { pageSize: 8 });

  const optionKeysPresent = template.optionKeys.filter(
    (o) => getOptionValues(o.key).length,
  );

  function canGoNext() {
    if (step === 1) return Boolean(form.name.trim() && form.price !== "");
    if (step === 2) return Boolean(htmlToPlainPreview(form.description, 8));
    return true;
  }

  async function downloadTemplate(format) {
    try {
      const res = await productApi.downloadBulkTemplate(format);
      const blob = new Blob([res.data], {
        type:
          format === "csv"
            ? "text/csv;charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "csv"
          ? "product-bulk-template.csv"
          : "product-bulk-template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify.success(`Template (${format.toUpperCase()}) downloaded`);
    } catch (err) {
      notify.fromError(err, "Could not download template");
    }
  }

  async function handleBulkUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!store?._id) {
      notify.error("Create your store before importing products.");
      return;
    }

    setBulkImporting(true);
    setBulkResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await productApi.bulkImport(formData);
      const data = res.data || {};
      setBulkResult(data);
      if (data.createdCount > 0) {
        notify.success(
          data.message || `Imported ${data.createdCount} products`,
        );
        await loadProducts();
      } else {
        notify.error(data.message || "No products were imported");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length || data?.createdCount != null) {
        setBulkResult(data);
      }
      notify.fromError(err, "Bulk import failed");
    } finally {
      setBulkImporting(false);
    }
  }

  return (
    <div className="vp-page">
      <CatalogPickerModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelect={prefillFromCatalog}
      />
      <header className="vp-header">
        <div>
          <h1>{editingId ? "Edit product" : "Products"}</h1>
          <p>
            {showForm
              ? "Pick a type (cloth, mobile, laptop, furniture…) — fields change to match."
              : "Manage your listings, or add a new product in three ways."}
          </p>
        </div>
        {showForm ? (
          <button
            type="button"
            className="vp-btn vp-btn-ghost"
            onClick={() => {
              resetForm();
              setShowForm(false);
            }}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" /> Close form
          </button>
        ) : null}
      </header>

      {!showForm ? (
        <section className="vp-starts">
          <button type="button" className="vp-start" onClick={openCreate}>
            <span className="vp-start__icon vp-start__icon--primary">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
            </span>
            <span className="vp-start__text">
              <strong>Add product</strong>
              <small>Guided steps with type-specific fields</small>
            </span>
            <i className="fa-solid fa-arrow-right vp-start__go" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="vp-start"
            onClick={() => setCatalogOpen(true)}
          >
            <span className="vp-start__icon vp-start__icon--catalog">
              <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
            </span>
            <span className="vp-start__text">
              <strong>Add from catalog</strong>
              <small>Auto-fill details from the brand catalog</small>
            </span>
            <i className="fa-solid fa-arrow-right vp-start__go" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`vp-start${showBulk ? " is-on" : ""}`}
            onClick={() => setShowBulk((v) => !v)}
          >
            <span className="vp-start__icon vp-start__icon--bulk">
              <i className="fa-solid fa-file-import" aria-hidden="true" />
            </span>
            <span className="vp-start__text">
              <strong>Bulk import</strong>
              <small>Upload many products via Excel / CSV</small>
            </span>
            <i
              className={`fa-solid ${
                showBulk ? "fa-chevron-up" : "fa-chevron-down"
              } vp-start__go`}
              aria-hidden="true"
            />
          </button>
        </section>
      ) : null}

      {!showForm && showBulk ? (
        <section className="vp-card vp-bulk">
          <h2>Bulk add products</h2>
          <p className="vp-bulk-lead">
            Download the Excel or CSV template, fill one product per row using
            your category slug, then upload the file. Options like color and
            size create versions automatically. Images are optional via public
            image URLs.
          </p>
          {categories.length > 0 ? (
            <p className="vp-bulk-cats">
              Your category slugs:{" "}
              {categories
                .map((c) => c.slug || c.name)
                .filter(Boolean)
                .slice(0, 12)
                .join(", ")}
              {categories.length > 12 ? "…" : ""}
            </p>
          ) : null}
          <div className="vp-bulk-actions">
            <button
              type="button"
              className="vp-btn vp-btn-ghost"
              onClick={() => downloadTemplate("xlsx")}
            >
              <i className="fa-solid fa-file-excel" aria-hidden="true" />{" "}
              Download Excel
            </button>
            <button
              type="button"
              className="vp-btn vp-btn-ghost"
              onClick={() => downloadTemplate("csv")}
            >
              <i className="fa-solid fa-file-csv" aria-hidden="true" /> Download
              CSV
            </button>
            <label
              className={`vp-btn vp-btn-primary ${bulkImporting ? "is-disabled" : ""}`}
            >
              <i className="fa-solid fa-upload" aria-hidden="true" />
              {bulkImporting ? "Importing…" : "Upload file"}
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                disabled={bulkImporting}
                onChange={handleBulkUpload}
              />
            </label>
          </div>
          {bulkResult ? (
            <div className="vp-bulk-result">
              <p>
                Created <strong>{bulkResult.createdCount || 0}</strong>
                {bulkResult.errorCount
                  ? ` · ${bulkResult.errorCount} row(s) failed`
                  : ""}
              </p>
              {bulkResult.errors?.length ? (
                <ul>
                  {bulkResult.errors.slice(0, 12).map((err) => (
                    <li key={`${err.row}-${err.message}`}>
                      Row {err.row}
                      {err.name ? ` (${err.name})` : ""}: {err.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {showForm ? (
        <form className="vp-form" onSubmit={handleSubmit}>
          {prefillBanner ? (
            <p className="vp-prefill-banner">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />{" "}
              {prefillBanner}{" "}
              <button
                type="button"
                className="vp-btn vp-btn-ghost"
                style={{ marginLeft: 8 }}
                onClick={() => setCatalogOpen(true)}
              >
                Change catalog item
              </button>
            </p>
          ) : null}

          <nav className="vp-steps" aria-label="Product steps">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`vp-step ${step === s.id ? "is-active" : ""} ${
                  step > s.id ? "is-done" : ""
                }`}
                onClick={() => setStep(s.id)}
              >
                <em>{s.id}</em>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          {step === 1 ? (
            <section className="vp-card">
              <h2>Basic info</h2>
              <p className="vp-hint">
                Choose the product type first —{" "}
                <strong>cloth, mobile, laptop, and furniture</strong> each show
                different models and specs in later steps.
              </p>

              <div className="vp-type-grid">
                {PRODUCT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`vp-type-card${
                      form.productType === t.id ? " is-on" : ""
                    }`}
                    onClick={() => changeProductType(t.id)}
                  >
                    <strong>{t.label}</strong>
                    <span>{t.hint}</span>
                  </button>
                ))}
              </div>

              <p className="vp-type-active">
                Active fields: <strong>{activeTypeMeta.label}</strong>
                {activeTypeMeta.hint ? ` · ${activeTypeMeta.hint}` : ""}
              </p>

              <div className="vp-grid">
                <label className="vp-field vp-field-full">
                  <span>Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="e.g. Galaxy S24 Ultra 256GB"
                    required
                  />
                </label>
                <label className="vp-field vp-field-full">
                  <span>Short tagline</span>
                  <input
                    name="shortDescription"
                    value={form.shortDescription}
                    onChange={updateField}
                    placeholder="One line customers see under the title"
                  />
                </label>
                <label className="vp-field">
                  <span>MRP (₹)</span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={updateField}
                    required
                  />
                </label>
                <label className="vp-field">
                  <span>Selling price (₹)</span>
                  <input
                    name="discountPrice"
                    type="number"
                    min="0"
                    value={form.discountPrice}
                    onChange={updateField}
                    placeholder="Optional"
                  />
                </label>
                <label className="vp-field">
                  <span>Brand</span>
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={updateField}
                  />
                </label>
                <label className="vp-field">
                  <span>Category</span>
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="vp-field">
                  <span>Status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="vp-card">
              <h2>Description</h2>
              <p className="vp-hint">
                Use bold, italic, colors, bullets, and headings — same style
                customers see on Amazon.
              </p>
              <RichTextEditor
                value={form.description}
                onChange={(html) =>
                  setForm((prev) => ({ ...prev, description: html }))
                }
              />

              <label
                className="vp-field vp-field-full"
                style={{ marginTop: 18 }}
              >
                <span>About this item (one highlight per line)</span>
                <textarea
                  name="aboutText"
                  rows={5}
                  value={form.aboutText}
                  onChange={updateField}
                  placeholder={
                    "6.7-inch AMOLED display\n5000 mAh fast charging\nIP68 water resistance"
                  }
                />
              </label>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="vp-card">
              <h2>Models & options — {activeTypeMeta.label}</h2>
              <p className="vp-hint">
                These options change by product type. Example: cloth uses{" "}
                <strong>size &amp; color</strong>; mobile uses{" "}
                <strong>storage &amp; RAM</strong>; furniture uses{" "}
                <strong>finish &amp; seating</strong>. Each combination becomes
                a model with its own MRP, selling price, and stock.
              </p>

              <div className="vp-options-grid">
                {template.optionKeys.map((opt) => (
                  <OptionTagInput
                    key={opt.key}
                    label={opt.label}
                    placeholder={opt.placeholder.split(",")[0]}
                    values={getOptionValues(opt.key)}
                    draft={form.optionDrafts[opt.key] || ""}
                    presets={opt.presets || []}
                    onTogglePreset={(value) => togglePreset(opt.key, value)}
                    onDraft={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        optionDrafts: {
                          ...prev.optionDrafts,
                          [opt.key]: value,
                        },
                      }))
                    }
                    onAdd={() => addOptionValue(opt.key)}
                    onRemove={(value) => removeOptionValue(opt.key, value)}
                  />
                ))}
              </div>

              {!template.optionKeys.length ? (
                <p className="vp-hint">
                  This product type has no model options — set stock on the
                  Basics step.
                </p>
              ) : null}

              <div className="vp-actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="vp-btn vp-btn-primary"
                  onClick={rebuildVariants}
                >
                  Build model price table
                </button>
                <button
                  type="button"
                  className="vp-btn vp-btn-ghost"
                  onClick={applyBasePriceToAllVersions}
                  disabled={!form.variants?.length}
                >
                  Apply base prices to all models
                </button>
              </div>

              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead>
                    <tr>
                      {optionKeysPresent.map((o) => (
                        <th key={o.key}>{o.label}</th>
                      ))}
                      {!optionKeysPresent.length ? <th>Model</th> : null}
                      <th>MRP (₹)</th>
                      <th>Selling (₹)</th>
                      <th>Discount</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((row, idx) => {
                      const mrp = Number(row.price) || 0;
                      const sell = Number(row.discountPrice) || 0;
                      const off =
                        mrp > 0 && sell > 0 && sell < mrp
                          ? Math.round(((mrp - sell) / mrp) * 100)
                          : 0;
                      return (
                        <tr key={idx}>
                          {optionKeysPresent.map((o) => (
                            <td key={o.key}>{row[o.key] || "—"}</td>
                          ))}
                          {!optionKeysPresent.length ? <td>Default</td> : null}
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="vp-stock-input"
                              placeholder={form.price || "MRP"}
                              value={row.price ?? ""}
                              onChange={(e) =>
                                updateVariantField(idx, "price", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="vp-stock-input"
                              placeholder={
                                form.discountPrice || form.price || "Sell"
                              }
                              value={row.discountPrice ?? ""}
                              onChange={(e) =>
                                updateVariantField(
                                  idx,
                                  "discountPrice",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            {off ? (
                              <span className="vp-off-pill">{off}% off</span>
                            ) : (
                              <span className="vp-hint" style={{ margin: 0 }}>
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="vp-stock-input"
                              value={row.stock ?? 0}
                              onChange={(e) =>
                                updateVariantField(idx, "stock", e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="vp-card">
              <h2>Specs & photos — {activeTypeMeta.label}</h2>
              <p className="vp-hint">
                Spec fields below are tailored to{" "}
                <strong>{activeTypeMeta.label}</strong>. Fill what you know,
                then add photos.
              </p>
              <div className="vp-grid">
                {template.specFields.map((spec) => (
                  <label key={spec.key} className="vp-field">
                    <span>{spec.key}</span>
                    <input
                      value={form.specInputs[spec.key] || ""}
                      placeholder={spec.placeholder}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          specInputs: {
                            ...prev.specInputs,
                            [spec.key]: e.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="vp-extra-specs">
                <h3>Custom fields</h3>
                {form.extraSpecs.map((row, idx) => (
                  <div key={idx} className="vp-grid">
                    <input
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setForm((prev) => {
                          const extraSpecs = [...prev.extraSpecs];
                          extraSpecs[idx] = { ...extraSpecs[idx], label };
                          return { ...prev, extraSpecs };
                        });
                      }}
                    />
                    <input
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => {
                          const extraSpecs = [...prev.extraSpecs];
                          extraSpecs[idx] = { ...extraSpecs[idx], value };
                          return { ...prev, extraSpecs };
                        });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="vp-btn vp-btn-ghost"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      extraSpecs: [
                        ...prev.extraSpecs,
                        { label: "", value: "" },
                      ],
                    }))
                  }
                >
                  Add custom field
                </button>
              </div>

              <div className="vp-photo-tools" style={{ marginTop: 16 }}>
                <div className="vp-actions">
                  <button
                    type="button"
                    className="vp-btn vp-btn-primary"
                    onClick={() => setPickerOpen(true)}
                  >
                    Choose from Media
                  </button>
                  <label className="vp-btn vp-btn-ghost">
                    Upload new
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        e.target.value = "";
                        const room = Math.max(0, 8 - galleryPicked.length);
                        setImages(files.slice(0, room));
                      }}
                    />
                  </label>
                  <Link className="vp-btn vp-btn-ghost" to="/vendor/media">
                    Open library
                  </Link>
                </div>
                <p className="vp-hint">
                  Up to 8 photos per product. Library supports 500+ images
                  (paginated). New uploads are also saved to Media for reuse.
                </p>
                <div className="vp-photo-preview">
                  {galleryPicked.map((img) => (
                    <div key={img.public_id} className="vp-photo-thumb">
                      <img src={img.url} alt="" />
                      <button
                        type="button"
                        className="vp-photo-remove"
                        onClick={() =>
                          setGalleryPicked((prev) =>
                            prev.filter((g) => g.public_id !== img.public_id),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.map((file, idx) => (
                    <div
                      key={`file-${idx}`}
                      className="vp-photo-thumb is-local"
                    >
                      <img src={URL.createObjectURL(file)} alt="" />
                      <span>New</span>
                    </div>
                  ))}
                  {!galleryPicked.length && !images.length ? (
                    <p className="muted">No photos selected yet.</p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <MediaPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            maxSelect={Math.max(0, 8 - images.length)}
            excludePublicIds={galleryPicked.map((g) => g.public_id)}
            onConfirm={(picked) => {
              setGalleryPicked((prev) => {
                const map = new Map(prev.map((p) => [p.public_id, p]));
                for (const img of picked) map.set(img.public_id, img);
                return [...map.values()].slice(0, 8);
              });
            }}
          />

          <footer className="vp-form-footer">
            <button
              type="button"
              className="vp-btn vp-btn-ghost"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                className="vp-btn vp-btn-primary"
                disabled={!canGoNext()}
                onClick={() => setStep((s) => Math.min(4, s + 1))}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="vp-btn vp-btn-primary"
                disabled={!store || saving}
              >
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save product"
                    : "Publish product"}
              </button>
            )}
          </footer>
        </form>
      ) : null}

      {managingProduct ? (
        <section className="vp-card">
          <div className="vp-card-head">
            <h2>Images — {managingProduct.name}</h2>
            <button
              type="button"
              className="vp-btn vp-btn-ghost"
              onClick={() => {
                setManagingId(null);
                setExtraImages([]);
                setOrderedImages([]);
              }}
            >
              Close
            </button>
          </div>
          <p className="vp-hint">
            Drag images to change order. The first image is the main photo on
            the shop.
            {reordering ? " Saving order…" : ""}
          </p>
          <div className="vp-image-grid">
            {orderedImages.map((img, index) => (
              <div
                key={img.public_id || img.url || index}
                className={`vp-image-tile vp-image-tile--drag ${
                  dragIndex === index ? "is-dragging" : ""
                } ${dropIndex === index ? "is-drop-target" : ""}`}
                draggable={!reordering}
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dropIndex !== index) setDropIndex(index);
                }}
                onDragLeave={() => {
                  if (dropIndex === index) setDropIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageDrop(index);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropIndex(null);
                }}
              >
                <span className="vp-image-badge">
                  {index === 0 ? "Main" : `#${index + 1}`}
                </span>
                <span
                  className="vp-image-handle"
                  title="Drag to reorder"
                  aria-hidden="true"
                >
                  <i className="fa-solid fa-grip-vertical" />
                </span>
                <img src={img.url} alt="" draggable={false} />
                <button
                  type="button"
                  className="vp-btn vp-btn-danger"
                  disabled={reordering}
                  onClick={() =>
                    handleRemoveImage(managingProduct, img.public_id)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            {!orderedImages.length ? (
              <p className="vp-hint">No images yet. Upload below.</p>
            ) : null}
          </div>
          <div className="vp-actions" style={{ marginTop: 12 }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setExtraImages(Array.from(e.target.files || []).slice(0, 8))
              }
            />
            <button
              type="button"
              className="vp-btn vp-btn-primary"
              onClick={() => handleAddImages(managingProduct)}
            >
              Upload
            </button>
          </div>
        </section>
      ) : null}

      <section className="vp-card">
        <div className="vp-card-head">
          <h2>Your catalog</h2>
          {products.length ? (
            <span className="vp-count">{products.length} products</span>
          ) : null}
        </div>
        {!products.length ? (
          <div className="vp-empty">
            <span className="vp-empty__icon">
              <i className="fa-solid fa-box-open" aria-hidden="true" />
            </span>
            <p>
              No products yet. Add your first item with type-specific details,
              or pick one from the company catalog.
            </p>
            <div className="vp-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="vp-btn vp-btn-ghost"
                onClick={() => setCatalogOpen(true)}
              >
                Add from catalog
              </button>
              <button
                type="button"
                className="vp-btn vp-btn-primary"
                onClick={openCreate}
              >
                Add manually
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="vp-catalog">
              {pageItems.map((product) => {
                const mrp = Number(product.price) || 0;
                const sell = Number(product.discountPrice) || 0;
                const hasOffer = sell > 0 && sell < mrp;
                const shown = hasOffer ? sell : mrp;
                const off = hasOffer
                  ? Math.round(((mrp - sell) / mrp) * 100)
                  : 0;
                const stock = Number(product.stock) || 0;
                const isActive = (product.status || "active") === "active";
                return (
                  <article key={product._id} className="vp-catalog-card">
                    <div className="vp-catalog-media">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt="" />
                      ) : (
                        <span>
                          <i className="fa-regular fa-image" aria-hidden="true" />
                        </span>
                      )}
                      <span
                        className={`vp-status ${
                          isActive ? "is-active" : "is-hidden"
                        }`}
                      >
                        {isActive ? "Live" : "Hidden"}
                      </span>
                      {off ? <span className="vp-off">{off}% off</span> : null}
                    </div>
                    <div className="vp-catalog-body">
                      <span className="vp-type-pill">
                        {product.productType || "generic"}
                      </span>
                      <h3>{product.name}</h3>
                      <div className="vp-price-row">
                        <strong>₹{shown.toLocaleString("en-IN")}</strong>
                        {hasOffer ? (
                          <s>₹{mrp.toLocaleString("en-IN")}</s>
                        ) : null}
                      </div>
                      <div className="vp-meta-row">
                        <span
                          className={`vp-stock${
                            stock === 0
                              ? " is-out"
                              : stock <= 5
                                ? " is-low"
                                : ""
                          }`}
                        >
                          <i
                            className="fa-solid fa-layer-group"
                            aria-hidden="true"
                          />{" "}
                          {stock === 0 ? "Out of stock" : `${stock} in stock`}
                        </span>
                        <span className="vp-catalog-opts">
                          {(product.optionGroups || []).length
                            ? `${product.optionGroups.length} option${
                                product.optionGroups.length > 1 ? "s" : ""
                              }`
                            : "Single SKU"}
                        </span>
                      </div>
                      <div className="vp-card-actions">
                        <button
                          type="button"
                          className="vp-btn vp-btn-ghost"
                          onClick={() => startEdit(product)}
                        >
                          <i className="fa-solid fa-pen" aria-hidden="true" />{" "}
                          Edit
                        </button>
                        <button
                          type="button"
                          className="vp-btn vp-btn-ghost"
                          onClick={() => openImageManager(product)}
                        >
                          <i
                            className="fa-regular fa-images"
                            aria-hidden="true"
                          />{" "}
                          Images
                        </button>
                        <button
                          type="button"
                          className="vp-icon-btn vp-icon-btn--danger"
                          title="Delete"
                          onClick={() => handleDelete(product._id)}
                        >
                          <i className="fa-solid fa-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              from={from}
              to={to}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
};

export default VendorProducts;
