/**
 * Shared MultiCommerce HTML email chrome (inline styles for mail clients).
 */

const BRAND = {
  ink: "#15231c",
  muted: "#5f6f66",
  paper: "#f3f5f2",
  line: "#d8ddd8",
  accent: "#0f6b4c",
  accentDeep: "#0a4f38",
  white: "#ffffff",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function primaryAppUrl() {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  return String(raw).split(",")[0].trim().replace(/\/$/, "");
}

/**
 * Wrap body content in a branded shell.
 * @param {{ preheader?: string, title: string, bodyHtml: string, cta?: { href: string, label: string }, footerNote?: string }} opts
 */
export function wrapEmail({ preheader = "", title, bodyHtml, cta, footerNote }) {
  const appUrl = primaryAppUrl();
  const ctaBlock = cta?.href
    ? `
      <tr>
        <td style="padding: 8px 32px 28px;">
          <a href="${escapeHtml(cta.href)}"
             style="display:inline-block;background:${BRAND.accent};color:${BRAND.white};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.02em;padding:14px 28px;border-radius:8px;">
            ${escapeHtml(cta.label || "Open MultiCommerce")}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.line};">
          <tr>
            <td style="background:${BRAND.accentDeep};padding:22px 32px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:${BRAND.white};letter-spacing:-0.02em;">
                MultiCommerce
              </p>
              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.72);">
                Your marketplace
              </p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${BRAND.accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:700;color:${BRAND.ink};">
                ${escapeHtml(title)}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${BRAND.muted};">
              ${footerNote || "If you did not expect this email, you can safely ignore it."}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.paper};border-top:1px solid ${BRAND.line};padding:18px 32px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:${BRAND.muted};text-align:center;">
              © ${new Date().getFullYear()} MultiCommerce
              ${appUrl ? ` · <a href="${escapeHtml(appUrl)}" style="color:${BRAND.accent};text-decoration:none;">Visit store</a>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRows(rows) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${BRAND.line};border-radius:8px;overflow:hidden;">
      ${rows
        .map(
          ([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? BRAND.paper : BRAND.white};">
          <td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BRAND.muted};width:38%;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${BRAND.ink};">
            ${escapeHtml(value)}
          </td>
        </tr>`
        )
        .join("")}
    </table>`;
}

export function otpEmailHtml(otp) {
  const code = escapeHtml(otp);
  return wrapEmail({
    preheader: `Your verification code is ${otp}. Expires in 10 minutes.`,
    title: "Verify your email",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${BRAND.muted};">
        Welcome to MultiCommerce. Enter this one-time code to verify your account:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
        <tr>
          <td align="center" style="background:${BRAND.paper};border:1px dashed ${BRAND.accent};border-radius:10px;padding:22px 16px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:700;letter-spacing:10px;color:${BRAND.accentDeep};">
              ${code}
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.muted};">
        This code expires in <strong style="color:${BRAND.ink};">10 minutes</strong>.
      </p>
    `,
    footerNote:
      "If you did not create a MultiCommerce account, you can ignore this email.",
  });
}

export function passwordResetEmailHtml({ portalLabel, resetUrl }) {
  return wrapEmail({
    preheader: `Reset your ${portalLabel} password. Link expires in 15 minutes.`,
    title: `${portalLabel} password reset`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${BRAND.muted};">
        We received a request to reset your MultiCommerce ${escapeHtml(portalLabel).toLowerCase()} password.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.muted};">
        This link expires in <strong style="color:${BRAND.ink};">15 minutes</strong>.
      </p>
    `,
    cta: { href: resetUrl, label: "Reset password" },
    footerNote: `If the button does not work, copy this link into your browser:<br /><a href="${escapeHtml(resetUrl)}" style="color:${BRAND.accent};word-break:break-all;">${escapeHtml(resetUrl)}</a><br /><br />If you did not request a reset, you can ignore this email.`,
  });
}

export function orderConfirmationEmailHtml({
  firstName,
  orderNumber,
  totalAmount,
  paymentMethod,
  paymentStatus,
  orderStatus,
}) {
  const name = firstName ? escapeHtml(firstName) : "there";
  const appUrl = primaryAppUrl();
  return wrapEmail({
    preheader: `Order ${orderNumber} confirmed · ${formatMoney(totalAmount)}`,
    title: "Thanks for your order",
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:${BRAND.muted};">
        Hi ${name}, your MultiCommerce order is confirmed and on its way to the seller.
      </p>
      ${detailRows([
        ["Order number", orderNumber],
        ["Amount", formatMoney(totalAmount)],
        ["Payment", `${paymentMethod || "—"} · ${paymentStatus || "—"}`],
        ["Status", orderStatus || "—"],
      ])}
      <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.muted};">
        You can track updates anytime from <strong style="color:${BRAND.ink};">My Orders</strong> in your account.
      </p>
    `,
    cta: appUrl
      ? { href: `${appUrl}/customer/orders`, label: "View my orders" }
      : undefined,
    footerNote:
      "Questions about your order? Open MultiCommerce and message support from your account.",
  });
}

export function paymentReceiptEmailHtml({
  firstName,
  orderNumber,
  totalAmount,
  paymentId,
}) {
  const name = firstName ? escapeHtml(firstName) : "there";
  const appUrl = primaryAppUrl();
  return wrapEmail({
    preheader: `Payment received for ${orderNumber} · ${formatMoney(totalAmount)}`,
    title: "Payment successful",
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:${BRAND.muted};">
        Hi ${name}, we received your payment for order <strong style="color:${BRAND.ink};">${escapeHtml(orderNumber)}</strong>.
      </p>
      ${detailRows([
        ["Amount paid", formatMoney(totalAmount)],
        ["Order number", orderNumber],
        ["Payment ID", paymentId || "N/A"],
      ])}
      <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.muted};">
        Your order is confirmed and will be processed by the seller shortly.
      </p>
    `,
    cta: appUrl
      ? { href: `${appUrl}/customer/orders`, label: "View order" }
      : undefined,
    footerNote:
      "Keep this email as your payment receipt. A tax invoice is available after delivery.",
  });
}
