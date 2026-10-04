import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { bannerApi, categoryApi, storeApi } from "../../api/services";
import { notify } from "../../utils/notify";
import TableRowActions from "../../components/shared/TableRowActions";
import {
  BANNER_TEMPLATES,
  createBannerTemplateImageFile,
  getBannerTemplatePreviewDataUrl,
} from "../../utils/bannerTemplates";
import "../../layouts/PanelLayout.css";

const initialForm = {
  title: "",
  subtitle: "",
  type: "slider",
  linkUrl: "",
  category: "",
  badgeText: "",
  sortOrder: "0",
  isActive: true,
};

/**
 * CMS for Flipkart-style home slider / offers / category tiles.
 * Admin + vendor can publish SVG brand templates or custom uploads.
 */
const MarketingBanners = ({ scope = "admin" }) => {
  const user = useSelector((state) => state.user.user);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [publishingTemplateId, setPublishingTemplateId] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [bannerRes, catRes] = await Promise.all([
        bannerApi.manage(),
        categoryApi.list(),
      ]);
      setBanners(bannerRes.data?.banners || []);
      const cats = Array.isArray(catRes.data)
        ? catRes.data
        : catRes.data?.data || [];
      setCategories(cats);
    } catch (err) {
      notify.fromError(err, "Failed to load banners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (scope !== "vendor" || !user?.id) return;
    let active = true;
    storeApi
      .getByVendor(user.id)
      .then((res) => {
        if (active) setStoreId(res.data?.data?._id || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [scope, user?.id]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function selectTemplate(template) {
    setSelectedTemplate(template);
    setImage(null);
    setForm((prev) => ({
      ...prev,
      type: template.type || "slider",
      title: template.title,
      subtitle: template.subtitle,
      badgeText: template.badgeText,
      linkUrl: prev.linkUrl || "/customer/products",
      isActive: true,
    }));
  }

  function buildFormData(formSnapshot, imageFile) {
    const formData = new FormData();
    Object.entries(formSnapshot).forEach(([key, value]) => {
      if (key === "isActive") formData.append(key, value ? "true" : "false");
      else if (value !== "") formData.append(key, value);
    });
    if (scope === "vendor" && storeId) formData.append("store", storeId);
    formData.append("image", imageFile);
    return formData;
  }

  async function publishBanner(formSnapshot, imageFile) {
    await bannerApi.create(buildFormData(formSnapshot, imageFile));
    await load();
  }

  async function handleCreate(event) {
    event.preventDefault();
    try {
      const templateFile =
        !image && selectedTemplate
          ? await createBannerTemplateImageFile(selectedTemplate)
          : null;
      const imageFile = image || templateFile;

      if (!imageFile) {
        notify.warning(
          "Choose an image or use one of the ready-made SVG templates.",
        );
        return;
      }

      await publishBanner(form, imageFile);
      notify.success("Banner published to the customer home page.");
      setForm(initialForm);
      setImage(null);
      setSelectedTemplate(null);
      event.target.reset?.();
    } catch (err) {
      notify.fromError(err, "Could not create banner.");
    }
  }

  async function publishTemplateNow(template) {
    setPublishingTemplateId(template.id);
    try {
      const nextSort = String(banners.length || 0);
      const templateForm = {
        ...initialForm,
        type: template.type || "slider",
        title: template.title,
        subtitle: template.subtitle,
        badgeText: template.badgeText,
        linkUrl: "/customer/products",
        sortOrder: nextSort,
      };
      const templateFile = await createBannerTemplateImageFile(template);
      await publishBanner(templateForm, templateFile);
      notify.success("Brand banner published.");
    } catch (err) {
      notify.fromError(err, "Could not publish template.");
    } finally {
      setPublishingTemplateId("");
    }
  }

  async function toggleActive(banner) {
    try {
      const formData = new FormData();
      formData.append("isActive", banner.isActive ? "false" : "true");
      await bannerApi.update(banner._id, formData);
      notify.success(banner.isActive ? "Banner hidden." : "Banner activated.");
      await load();
    } catch (err) {
      notify.fromError(err, "Update failed.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await bannerApi.remove(id);
      notify.success("Banner deleted.");
      await load();
    } catch (err) {
      notify.fromError(err, "Delete failed.");
    }
  }

  return (
    <div className="stack-gap">
      <section className="vendor-hero">
        <div className="vendor-hero-copy">
          <h2 className="page-title">
            {scope === "vendor" ? "Marketing" : "Home Marketing"}
          </h2>
          <p className="page-subtitle">
            {scope === "vendor"
              ? "Publish SVG brand banners or custom creatives to the shop home."
              : "Platform and store banners for the customer home page — use SVG brand templates or upload your own."}
          </p>
        </div>
      </section>

      <section className="form-card banner-template-card">
        <div className="banner-template-head">
          <div>
            <h3>SVG brand banner templates</h3>
            <p className="muted" style={{ margin: 0 }}>
              Vector designs for{" "}
              {scope === "admin" ? "admins and vendors" : "your store"}. Use
              as-is, edit the text, then publish.
            </p>
          </div>
          {selectedTemplate ? (
            <button
              type="button"
              className="panel-btn secondary"
              onClick={() => setSelectedTemplate(null)}
            >
              Clear selected
            </button>
          ) : null}
        </div>

        <div className="banner-template-grid">
          {BANNER_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className={`banner-template-item${
                selectedTemplate?.id === template.id ? " is-selected" : ""
              }`}
            >
              <button
                type="button"
                className="banner-template-preview banner-template-preview--svg"
                onClick={() => selectTemplate(template)}
                aria-label={`Use ${template.title} template`}
              >
                <img
                  src={getBannerTemplatePreviewDataUrl(template)}
                  alt=""
                  className="banner-template-art"
                />
                <span className="banner-template-copy">
                  <span className="banner-template-badge">
                    {template.badgeText}
                  </span>
                  <strong>{template.title}</strong>
                  <small>{template.subtitle}</small>
                </span>
              </button>
              <div className="banner-template-actions">
                <button
                  type="button"
                  className="panel-btn secondary"
                  onClick={() => selectTemplate(template)}
                >
                  Use template
                </button>
                <button
                  type="button"
                  className="panel-btn"
                  disabled={publishingTemplateId === template.id}
                  onClick={() => publishTemplateNow(template)}
                >
                  {publishingTemplateId === template.id
                    ? "Publishing…"
                    : "Publish now"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="form-card">
        <h3>
          {selectedTemplate
            ? "Customize selected SVG template"
            : "Add custom banner"}
        </h3>
        <p className="muted" style={{ margin: "0 0 1rem" }}>
          {selectedTemplate
            ? "Title, subtitle and badge show on the customer home. The SVG artwork has no baked-in text."
            : "Upload your own creative, or pick an SVG template above."}
        </p>
        <form className="panel-form panel-form--banner" onSubmit={handleCreate}>
          <div className="panel-form-grid">
            <label className="panel-field">
              <span>Banner type</span>
              <select name="type" value={form.type} onChange={updateField}>
                <option value="slider">Hero slider (big home carousel)</option>
                <option value="offer">Offer card</option>
                <option value="category">Category highlight</option>
              </select>
            </label>

            <label className="panel-field">
              <span>Display order</span>
              <input
                name="sortOrder"
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={updateField}
              />
              <small className="muted">
                Lower number shows first. Use 0 for the first slide, then 1, 2,
                3…
              </small>
            </label>
          </div>

          <label className="panel-field">
            <span>Title</span>
            <input
              name="title"
              placeholder="e.g. Summer sale"
              value={form.title}
              onChange={updateField}
              required
            />
          </label>

          <label className="panel-field">
            <span>Subtitle (optional)</span>
            <input
              name="subtitle"
              placeholder="Short line under the title"
              value={form.subtitle}
              onChange={updateField}
            />
          </label>

          <div className="panel-form-grid">
            <label className="panel-field">
              <span>Badge text (optional)</span>
              <input
                name="badgeText"
                placeholder="e.g. 50% OFF"
                value={form.badgeText}
                onChange={updateField}
              />
            </label>

            <label className="panel-field">
              <span>Link to category (optional)</span>
              <select
                name="category"
                value={form.category}
                onChange={updateField}
              >
                <option value="">No category link</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="panel-field">
            <span>Click link (optional)</span>
            <input
              name="linkUrl"
              placeholder="/customer/products or full URL"
              value={form.linkUrl}
              onChange={updateField}
            />
            <small className="muted">
              Where shoppers go when they click this banner.
            </small>
          </label>

          <label className="panel-field">
            <span>Banner image {selectedTemplate ? "(optional)" : ""}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setImage(e.target.files?.[0] || null);
                if (e.target.files?.[0]) setSelectedTemplate(null);
              }}
            />
            <small className="muted">
              {selectedTemplate
                ? "Leave empty to keep the SVG brand artwork, or upload your own image to replace it."
                : "Recommended: hero slider 1600×420 · offers/category ~800×400."}
            </small>
          </label>

          <label className="panel-check">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={updateField}
            />
            Show on customer home now
          </label>

          <div className="panel-form-actions">
            <button className="panel-btn" type="submit">
              Publish banner
            </button>
          </div>
        </form>
      </div>

      {loading ? <p className="muted">Loading…</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Type</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner._id}>
                <td>
                  {banner.image?.url ? (
                    <img
                      src={banner.image.url}
                      alt=""
                      style={{
                        width: 96,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <strong>{banner.title}</strong>
                  {banner.subtitle ? (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {banner.subtitle}
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className="status-chip">
                    {banner.type === "slider"
                      ? "Hero slider"
                      : banner.type === "offer"
                        ? "Offer card"
                        : "Category"}
                  </span>
                </td>
                <td className="table-num">{banner.sortOrder ?? 0}</td>
                <td>{banner.isActive ? "Active" : "Hidden"}</td>
                <td className="row-actions">
                  <TableRowActions
                    items={[
                      {
                        key: "toggle",
                        label: banner.isActive ? "Hide" : "Show",
                        onClick: () => toggleActive(banner),
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        tone: "danger",
                        onClick: () => handleDelete(banner._id),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {!loading && !banners.length ? (
              <tr>
                <td colSpan={6}>
                  No banners yet. Publish an SVG brand template to show on the
                  home page.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketingBanners;
