import { useEffect, useMemo, useState } from "react";
import { catalogApi, categoryApi } from "../../api/services";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import "../../layouts/PanelLayout.css";
import { notify } from "../../utils/notify";
import {
  PRODUCT_TYPES,
  getProductTypeTemplate,
  suggestProductTypeFromCategory,
} from "../../utils/productTypeTemplates";

const emptyForm = () => ({
  brand: "",
  name: "",
  categorySlug: "",
  productType: "generic",
  suggestedPrice: "",
  suggestedDiscountPrice: "",
  shortDescription: "",
  description: "",
  aboutText: "",
  imageText: "",
  status: "active",
  optionGroups: [{ key: "", label: "", valuesText: "" }],
  specifications: [{ label: "", value: "" }],
});

function templateFields(typeId) {
  const tmpl = getProductTypeTemplate(typeId);
  return {
    optionGroups: tmpl.optionKeys.map((o) => ({
      key: o.key,
      label: o.label,
      valuesText: (o.presets || []).slice(0, 4).join(", "),
    })),
    specifications: tmpl.specFields.map((s) => ({
      label: s.key,
      value: "",
    })),
  };
}

function toForm(item) {
  return {
    brand: item.brand || "",
    name: item.name || "",
    categorySlug: item.categorySlug || item.category?.slug || "",
    productType: item.productType || "generic",
    suggestedPrice: item.suggestedPrice ?? "",
    suggestedDiscountPrice: item.suggestedDiscountPrice ?? "",
    shortDescription: item.shortDescription || "",
    description: item.description || "",
    aboutText: (item.aboutItems || []).join("\n"),
    imageText: (item.images || []).map((i) => i.url).join("\n"),
    status: item.status || "active",
    optionGroups: (item.optionGroups || []).length
      ? item.optionGroups.map((g) => ({
          key: g.key || "",
          label: g.label || "",
          valuesText: (g.values || []).join(", "),
        }))
      : [{ key: "", label: "", valuesText: "" }],
    specifications: (item.specifications || []).length
      ? item.specifications.map((s) => ({ label: s.label, value: s.value }))
      : [{ label: "", value: "" }],
  };
}

function buildPayload(form) {
  const images = String(form.imageText || "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url) => ({ url, public_id: url }));

  const optionGroups = (form.optionGroups || [])
    .map((g) => ({
      key: String(g.key || "").trim(),
      label: String(g.label || g.key || "").trim(),
      values: String(g.valuesText || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((g) => g.key && g.values.length);

  const specifications = (form.specifications || [])
    .map((s) => ({
      label: String(s.label || "").trim(),
      value: String(s.value || "").trim(),
    }))
    .filter((s) => s.label && s.value);

  const aboutItems = String(form.aboutText || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    brand: form.brand.trim(),
    name: form.name.trim(),
    categorySlug: form.categorySlug || undefined,
    productType: form.productType || "generic",
    suggestedPrice:
      form.suggestedPrice === "" ? undefined : Number(form.suggestedPrice),
    suggestedDiscountPrice:
      form.suggestedDiscountPrice === ""
        ? undefined
        : Number(form.suggestedDiscountPrice),
    shortDescription: form.shortDescription,
    description: form.description,
    aboutItems,
    images,
    optionGroups,
    specifications,
    status: form.status,
  };
}

function formatPrice(n) {
  if (n == null || n === "") return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

const AdminCatalog = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brandFilter, setBrandFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (brandFilter) params.brand = brandFilter;
      if (query.trim()) params.q = query.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await catalogApi.list(params);
      setItems(res.data?.data || []);
    } catch (err) {
      notify.fromError(err, "Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    categoryApi
      .list({ all: "true" })
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFilter, query, statusFilter]);

  const brands = useMemo(() => {
    const set = new Set(items.map((i) => i.brand).filter(Boolean));
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!typeFilter) return items;
    return items.filter((i) => i.productType === typeFilter);
  }, [items, typeFilter]);

  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === "active").length;
    const brandCount = new Set(items.map((i) => i.brand).filter(Boolean)).size;
    return {
      total: items.length,
      active,
      hidden: items.length - active,
      brands: brandCount,
    };
  }, [items]);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(filtered, { pageSize: 12 });

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function openCreate() {
    const seeded = {
      ...emptyForm(),
      ...templateFields("generic"),
    };
    setForm(seeded);
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(item) {
    setForm(toForm(item));
    setEditingId(item._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setField(name, value) {
    if (name === "productType") {
      const fields = templateFields(value);
      setForm((prev) => ({
        ...prev,
        productType: value,
        optionGroups: fields.optionGroups,
        specifications: fields.specifications,
      }));
      notify.info(
        `Loaded ${PRODUCT_TYPES.find((t) => t.id === value)?.label || value} fields.`
      );
      return;
    }
    if (name === "categorySlug") {
      const cat = categories.find((c) => c.slug === value);
      const suggested = suggestProductTypeFromCategory(cat);
      if (suggested && suggested !== form.productType) {
        const fields = templateFields(suggested);
        setForm((prev) => ({
          ...prev,
          categorySlug: value,
          productType: suggested,
          optionGroups: fields.optionGroups,
          specifications: fields.specifications,
        }));
        notify.info(
          `Switched to ${
            PRODUCT_TYPES.find((t) => t.id === suggested)?.label || suggested
          } fields for this category.`
        );
        return;
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateGroup(index, key, value) {
    setForm((prev) => {
      const optionGroups = [...prev.optionGroups];
      optionGroups[index] = { ...optionGroups[index], [key]: value };
      return { ...prev, optionGroups };
    });
  }
  function addGroup() {
    setForm((prev) => ({
      ...prev,
      optionGroups: [
        ...prev.optionGroups,
        { key: "", label: "", valuesText: "" },
      ],
    }));
  }
  function removeGroup(index) {
    setForm((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.filter((_, i) => i !== index),
    }));
  }

  function updateSpec(index, key, value) {
    setForm((prev) => {
      const specifications = [...prev.specifications];
      specifications[index] = { ...specifications[index], [key]: value };
      return { ...prev, specifications };
    });
  }
  function addSpec() {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { label: "", value: "" }],
    }));
  }
  function removeSpec(index) {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.brand.trim() || !form.name.trim()) {
      notify.warning("Brand and name are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editingId) {
        await catalogApi.update(editingId, payload);
        notify.success("Catalog item updated.");
      } else {
        await catalogApi.create(payload);
        notify.success("Catalog item created.");
      }
      closeForm();
      await load();
    } catch (err) {
      notify.fromError(err, "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this catalog item?")) return;
    try {
      await catalogApi.remove(id);
      notify.success("Deleted.");
      await load();
    } catch (err) {
      notify.fromError(err, "Delete failed.");
    }
  }

  async function toggleStatus(item) {
    try {
      await catalogApi.update(item._id, {
        status: item.status === "active" ? "inactive" : "active",
      });
      notify.success(
        item.status === "active" ? "Hidden from vendors." : "Now available to vendors."
      );
      await load();
    } catch (err) {
      notify.fromError(err, "Could not update status.");
    }
  }

  const previewImage = String(form.imageText || "")
    .split(/\n+/)
    .map((value) => value.trim())
    .find(Boolean);

  const activeType =
    PRODUCT_TYPES.find((t) => t.id === form.productType) || PRODUCT_TYPES[0];

  return (
    <div className="stack-gap cat-page">
      <div className="cat-head">
        <div>
          <h2 className="page-title">Master catalog</h2>
          <p className="page-subtitle">
            Brand → product → models. Vendors browse these and auto-fill their
            listings.
          </p>
        </div>
        {!showForm ? (
          <button type="button" className="panel-btn" onClick={openCreate}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Add master
            product
          </button>
        ) : (
          <button type="button" className="panel-btn secondary" onClick={closeForm}>
            Close form
          </button>
        )}
      </div>

      {!showForm ? (
        <div className="cat-stats">
          <div className="cat-stat">
            <em>{stats.total}</em>
            <span>Products</span>
          </div>
          <div className="cat-stat">
            <em>{stats.brands}</em>
            <span>Brands</span>
          </div>
          <div className="cat-stat is-live">
            <em>{stats.active}</em>
            <span>Live for vendors</span>
          </div>
          <div className="cat-stat is-muted">
            <em>{stats.hidden}</em>
            <span>Hidden</span>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form className="cat-form" onSubmit={handleSubmit}>
          <div className="cat-form__heading">
            <div>
              <span className="cat-eyebrow">
                {editingId ? "Editing catalog item" : "New catalog item"}
              </span>
              <h3>
                {editingId ? "Edit master product" : "Add master product"}
              </h3>
              <p>
                Build a reusable product template. Vendors select it, set stock
                &amp; price, then publish.
              </p>
            </div>
            <span className={`cat-live-state is-${form.status}`}>
              <i className="fa-solid fa-circle" aria-hidden="true" />
              {form.status === "active" ? "Available to vendors" : "Hidden"}
            </span>
          </div>

          <div className="cat-form__layout">
            <div className="cat-form__main">
              <section className="cat-section">
                <div className="cat-section__head">
                  <span className="cat-section__icon">
                    <i className="fa-solid fa-box" aria-hidden="true" />
                  </span>
                  <div>
                    <h4>Product identity</h4>
                    <p>
                      Pick a type first — options &amp; specs change for cloth,
                      mobile, laptop, furniture…
                    </p>
                  </div>
                </div>

                <div className="cat-type-grid">
                  {PRODUCT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`cat-type-chip${
                        form.productType === t.id ? " is-on" : ""
                      }`}
                      onClick={() => setField("productType", t.id)}
                    >
                      <strong>{t.label}</strong>
                      <small>{t.hint}</small>
                    </button>
                  ))}
                </div>

                <p className="cat-type-active">
                  Active template: <strong>{activeType.label}</strong>
                  {activeType.hint ? ` · ${activeType.hint}` : ""}
                </p>

                <div className="cat-grid">
                  <label className="cat-field">
                    <span>Brand *</span>
                    <input
                      value={form.brand}
                      onChange={(e) => setField("brand", e.target.value)}
                      placeholder="Samsung, Apple, Nike…"
                      required
                    />
                  </label>
                  <label className="cat-field">
                    <span>Product name *</span>
                    <input
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="Galaxy S24 Ultra"
                      required
                    />
                  </label>
                  <label className="cat-field">
                    <span>Category</span>
                    <select
                      value={form.categorySlug}
                      onChange={(e) => setField("categorySlug", e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="cat-field">
                    <span>Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                    >
                      <option value="active">Active (vendors can use)</option>
                      <option value="inactive">Inactive (hidden)</option>
                    </select>
                  </label>
                  <label className="cat-field">
                    <span>Suggested MRP (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={form.suggestedPrice}
                      onChange={(e) =>
                        setField("suggestedPrice", e.target.value)
                      }
                    />
                  </label>
                  <label className="cat-field">
                    <span>Suggested selling price (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={form.suggestedDiscountPrice}
                      onChange={(e) =>
                        setField("suggestedDiscountPrice", e.target.value)
                      }
                    />
                  </label>
                  <label className="cat-field cat-field-full">
                    <span>Short description</span>
                    <input
                      value={form.shortDescription}
                      onChange={(e) =>
                        setField("shortDescription", e.target.value)
                      }
                      placeholder="One-line summary"
                    />
                  </label>
                </div>
              </section>

              <section className="cat-section">
                <div className="cat-section__head">
                  <span className="cat-section__icon is-violet">
                    <i className="fa-solid fa-align-left" aria-hidden="true" />
                  </span>
                  <div>
                    <h4>Content &amp; media</h4>
                    <p>Buyer-facing details, highlights, and image URLs.</p>
                  </div>
                </div>
                <div className="cat-grid">
                  <label className="cat-field cat-field-full">
                    <span>Description</span>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      placeholder="Full description (HTML allowed)"
                    />
                  </label>
                  <label className="cat-field cat-field-full">
                    <span>Highlights (one per line)</span>
                    <textarea
                      rows={3}
                      value={form.aboutText}
                      onChange={(e) => setField("aboutText", e.target.value)}
                      placeholder={"Key feature 1\nKey feature 2"}
                    />
                  </label>
                  <label className="cat-field cat-field-full">
                    <span>Image URLs (one per line)</span>
                    <textarea
                      rows={2}
                      value={form.imageText}
                      onChange={(e) => setField("imageText", e.target.value)}
                      placeholder="https://…/image.jpg"
                    />
                  </label>
                </div>
              </section>

              <section className="cat-section">
                <div className="cat-section__head cat-section__head--action">
                  <div className="cat-section__title">
                    <span className="cat-section__icon is-amber">
                      <i
                        className="fa-solid fa-layer-group"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h4>Models &amp; options — {activeType.label}</h4>
                      <p>
                        Pre-filled for this type. Edit values or add more
                        groups.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cat-add-btn"
                    onClick={addGroup}
                  >
                    <i className="fa-solid fa-plus" aria-hidden="true" /> Add
                    group
                  </button>
                </div>
                <div className="cat-repeat">
                  <div className="cat-repeat-labels" aria-hidden="true">
                    <span>Key</span>
                    <span>Display label</span>
                    <span>Available values</span>
                    <span />
                  </div>
                  {form.optionGroups.map((g, i) => (
                    <div key={i} className="cat-repeat-row">
                      <input
                        aria-label={`Option ${i + 1} key`}
                        placeholder="color"
                        value={g.key}
                        onChange={(e) => updateGroup(i, "key", e.target.value)}
                      />
                      <input
                        aria-label={`Option ${i + 1} label`}
                        placeholder="Color"
                        value={g.label}
                        onChange={(e) =>
                          updateGroup(i, "label", e.target.value)
                        }
                      />
                      <input
                        aria-label={`Option ${i + 1} values`}
                        placeholder="Black, Blue, Silver"
                        value={g.valuesText}
                        onChange={(e) =>
                          updateGroup(i, "valuesText", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="cat-remove-btn"
                        aria-label={`Remove option group ${i + 1}`}
                        onClick={() => removeGroup(i)}
                      >
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="cat-section">
                <div className="cat-section__head cat-section__head--action">
                  <div className="cat-section__title">
                    <span className="cat-section__icon is-cyan">
                      <i
                        className="fa-solid fa-list-check"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h4>Specifications — {activeType.label}</h4>
                      <p>
                        Type-specific fields are ready — fill in the values.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cat-add-btn"
                    onClick={addSpec}
                  >
                    <i className="fa-solid fa-plus" aria-hidden="true" /> Add
                    spec
                  </button>
                </div>
                <div className="cat-repeat">
                  <div
                    className="cat-repeat-labels cat-repeat-labels--2"
                    aria-hidden="true"
                  >
                    <span>Specification</span>
                    <span>Value</span>
                    <span />
                  </div>
                  {form.specifications.map((s, i) => (
                    <div key={i} className="cat-repeat-row cat-repeat-row--2">
                      <input
                        aria-label={`Specification ${i + 1} label`}
                        placeholder="Battery"
                        value={s.label}
                        onChange={(e) => updateSpec(i, "label", e.target.value)}
                      />
                      <input
                        aria-label={`Specification ${i + 1} value`}
                        placeholder="5000 mAh"
                        value={s.value}
                        onChange={(e) => updateSpec(i, "value", e.target.value)}
                      />
                      <button
                        type="button"
                        className="cat-remove-btn"
                        aria-label={`Remove specification ${i + 1}`}
                        onClick={() => removeSpec(i)}
                      >
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="cat-form__aside">
              <div className="cat-preview">
                <span className="cat-preview__label">Vendor preview</span>
                <div className="cat-preview__media">
                  {previewImage ? (
                    <img src={previewImage} alt="" />
                  ) : (
                    <i className="fa-regular fa-image" aria-hidden="true" />
                  )}
                </div>
                <span className="cat-preview__brand">
                  {form.brand || "Brand name"}
                </span>
                <h4>{form.name || "Product name"}</h4>
                <p>
                  {form.shortDescription ||
                    "Your short product summary appears here."}
                </p>
                <div className="cat-preview__price">
                  <strong>
                    {formatPrice(
                      form.suggestedDiscountPrice || form.suggestedPrice || 0
                    )}
                  </strong>
                  {form.suggestedDiscountPrice && form.suggestedPrice ? (
                    <s>{formatPrice(form.suggestedPrice)}</s>
                  ) : null}
                </div>
                <div className="cat-preview__meta">
                  <span>{activeType.label}</span>
                  <span>
                    {
                      form.optionGroups.filter((group) => group.key).length
                    }{" "}
                    option groups
                  </span>
                </div>
              </div>

              <div className="cat-form__tips">
                <strong>Before saving</strong>
                <span>
                  <i className="fa-solid fa-check" /> Use an exact brand and
                  model name
                </span>
                <span>
                  <i className="fa-solid fa-check" /> Add at least one clear
                  image URL
                </span>
                <span>
                  <i className="fa-solid fa-check" /> Keep option values
                  comma-separated
                </span>
              </div>
            </aside>
          </div>

          <footer className="cat-form__footer">
            <span>Required: brand and product name</span>
            <div>
              <button
                type="button"
                className="cat-cancel-btn"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button type="submit" className="cat-save-btn" disabled={saving}>
                <i className="fa-solid fa-check" aria-hidden="true" />
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create product"}
              </button>
            </div>
          </footer>
        </form>
      ) : null}

      {!showForm ? (
        <>
          <div className="cat-toolbar">
            <div className="cat-search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                placeholder="Search brand or product…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All status</option>
              <option value="active">Live</option>
              <option value="inactive">Hidden</option>
            </select>
          </div>

          {loading ? (
            <p className="muted">Loading catalog…</p>
          ) : !filtered.length ? (
            <div className="cat-empty">
              <span className="cat-empty__icon">
                <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
              </span>
              <h3>No catalog products yet</h3>
              <p>
                Add a master product so vendors can auto-fill listings, or seed
                with <code>npm run seed:master</code>.
              </p>
              <button type="button" className="panel-btn" onClick={openCreate}>
                <i className="fa-solid fa-plus" aria-hidden="true" /> Add first
                product
              </button>
            </div>
          ) : (
            <>
              <div className="cat-browse">
                {pageItems.map((item) => {
                  const mrp = Number(item.suggestedPrice) || 0;
                  const sell = Number(item.suggestedDiscountPrice) || 0;
                  const hasOffer = sell > 0 && sell < mrp;
                  const shown = hasOffer ? sell : mrp;
                  const typeLabel =
                    PRODUCT_TYPES.find((t) => t.id === item.productType)
                      ?.label || item.productType;
                  return (
                    <article key={item._id} className="cat-browse-card">
                      <div className="cat-browse-media">
                        {item.images?.[0]?.url ? (
                          <img src={item.images[0].url} alt="" />
                        ) : (
                          <i className="fa-regular fa-image" aria-hidden="true" />
                        )}
                        <span
                          className={`cat-browse-status ${
                            item.status === "active" ? "is-live" : "is-hidden"
                          }`}
                        >
                          {item.status === "active" ? "Live" : "Hidden"}
                        </span>
                      </div>
                      <div className="cat-browse-body">
                        <span className="cat-browse-brand">{item.brand}</span>
                        <h3>{item.name}</h3>
                        {item.shortDescription ? (
                          <p className="cat-browse-desc">
                            {item.shortDescription}
                          </p>
                        ) : null}
                        <div className="cat-browse-price">
                          <strong>{formatPrice(shown || null)}</strong>
                          {hasOffer ? <s>{formatPrice(mrp)}</s> : null}
                        </div>
                        <div className="cat-browse-meta">
                          <span>{typeLabel}</span>
                          <span>
                            {(item.optionGroups || []).length
                              ? `${item.optionGroups.length} options`
                              : "Single"}
                          </span>
                        </div>
                        <div className="cat-browse-actions">
                          <button
                            type="button"
                            className="cat-browse-btn"
                            onClick={() => openEdit(item)}
                          >
                            <i className="fa-solid fa-pen" aria-hidden="true" />{" "}
                            Edit
                          </button>
                          <button
                            type="button"
                            className="cat-browse-btn"
                            onClick={() => toggleStatus(item)}
                          >
                            {item.status === "active" ? "Hide" : "Publish"}
                          </button>
                          <button
                            type="button"
                            className="cat-browse-btn is-danger"
                            onClick={() => handleDelete(item._id)}
                            title="Delete"
                          >
                            <i
                              className="fa-solid fa-trash"
                              aria-hidden="true"
                            />
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
        </>
      ) : null}
    </div>
  );
};

export default AdminCatalog;
