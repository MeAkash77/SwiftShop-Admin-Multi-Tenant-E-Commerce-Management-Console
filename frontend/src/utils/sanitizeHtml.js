import DOMPurify from "dompurify";

/** Sanitize vendor HTML before rendering on the customer PDP. */
export function sanitizeProductHtml(html = "") {
  return DOMPurify.sanitize(String(html || ""), {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "class"],
  });
}

export function htmlToPlainPreview(html = "", max = 160) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
