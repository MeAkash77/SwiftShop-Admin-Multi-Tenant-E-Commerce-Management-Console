import TableRowActions from "../shared/TableRowActions";

function labelFromNode(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(labelFromNode).join("");
  if (node?.props?.children != null) return labelFromNode(node.props.children);
  return "";
}

/**
 * Vendor table actions → Shopify-plain text link + ⋯ menu.
 * Prefer `items`. Legacy primary / moreOptions / onMore still work.
 */
export default function VendorRowActions({
  items = null,
  primary = null,
  moreOptions = [],
  onMore,
  danger = null,
  maxPrimary = 1,
}) {
  if (Array.isArray(items)) {
    return <TableRowActions items={items} maxPrimary={maxPrimary} />;
  }

  const built = [];

  if (primary && typeof primary === "object" && primary.props) {
    const label = labelFromNode(primary.props.children) || "Open";
    built.push({
      key: "primary",
      label,
      to: primary.props.to,
      onClick: primary.props.onClick,
      disabled: primary.props.disabled,
    });
  }

  for (const opt of moreOptions || []) {
    if (!opt) continue;
    if (opt.value === "__delete") {
      built.push({
        key: "delete",
        label: opt.label || "Delete",
        tone: "danger",
        onClick: () => onMore?.("__delete"),
      });
      continue;
    }
    built.push({
      key: String(opt.value),
      label: opt.label,
      onClick: () => onMore?.(opt.value),
    });
  }

  if (danger) {
    built.push({
      key: "danger",
      label: danger.label || "Delete",
      tone: "danger",
      onClick: danger.onSelect,
      disabled: danger.disabled,
    });
  }

  return <TableRowActions items={built} maxPrimary={maxPrimary} />;
}
