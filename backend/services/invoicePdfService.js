import PDFDocument from "pdfkit";

const INK = "#15231c";
const MUTED = "#5f6f66";
const LINE = "#d8ddd8";
const PAPER = "#f3f5f2";
const ACCENT = "#0f6b4c";
const ACCENT_DEEP = "#0a4f38";
const WHITE = "#ffffff";

function money(n) {
  const v = Number(n) || 0;
  return `Rs. ${v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function customerName(user) {
  if (!user) return "Customer";
  if (user.fullName) return user.fullName;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : user.email || "Customer";
}

/** Draw text without triggering PDFKit auto page-breaks */
function drawText(doc, text, x, y, options = {}) {
  doc.text(String(text ?? ""), x, y, {
    lineBreak: false,
    ...options,
    ...(options.width && !options.height
      ? { height: options.maxHeight || 60 }
      : {}),
  });
}

/**
 * Build a MultiCommerce tax invoice PDF (calm marketplace layout, single page).
 */
export function buildInvoicePdf({ order, items, store, customer }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Invoice ${order.orderNumber}`,
          Author: store?.storeName || "MultiCommerce",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const left = 42;
      const right = pageWidth - 42;
      const contentWidth = right - left;
      const footerTop = pageHeight - 36;
      const contentBottom = footerTop - 18;
      const invoiceNo = `INV-${String(order.orderNumber || order._id).replace(/^ORD-/, "")}`;

      // Soft paper background wash at top
      doc.rect(0, 0, pageWidth, 118).fill(PAPER);
      doc.rect(0, 0, 6, pageHeight).fill(ACCENT);

      // Brand + title
      doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(16);
      drawText(doc, "MultiCommerce", left, 28);

      doc.fillColor(MUTED).font("Helvetica").fontSize(8);
      drawText(doc, "Marketplace tax invoice", left, 48);

      doc.fillColor(INK).font("Helvetica-Bold").fontSize(20);
      drawText(doc, "Tax Invoice", left + contentWidth / 2, 28, {
        width: contentWidth / 2,
        align: "right",
      });
      doc.fillColor(MUTED).font("Helvetica").fontSize(8);
      drawText(doc, "Original for recipient", left + contentWidth / 2, 52, {
        width: contentWidth / 2,
        align: "right",
      });

      // Meta cards
      let y = 78;
      const metaW = (contentWidth - 18) / 4;
      const meta = [
        ["Invoice no.", invoiceNo],
        ["Order ID", String(order.orderNumber || "—")],
        ["Order date", formatDate(order.createdAt)],
        ["Invoice date", formatDate(order.paidAt || order.updatedAt || order.createdAt)],
      ];

      meta.forEach(([label, value], i) => {
        const x = left + i * (metaW + 6);
        doc.roundedRect(x, y, metaW, 34, 4).fill(WHITE);
        doc.roundedRect(x, y, metaW, 34, 4).strokeColor(LINE).lineWidth(0.8).stroke();
        doc.fillColor(MUTED).font("Helvetica").fontSize(7);
        drawText(doc, label.toUpperCase(), x + 8, y + 7, { width: metaW - 14, maxHeight: 10 });
        doc.fillColor(INK).font("Helvetica-Bold").fontSize(8);
        drawText(doc, value, x + 8, y + 18, { width: metaW - 14, maxHeight: 12 });
      });

      y = 128;

      // Sold by / Bill to
      const colW = (contentWidth - 16) / 2;
      const soldLines = [
        store?.storeName || "Seller",
        store?.address || "",
        store?.email ? `Email: ${store.email}` : "",
        store?.phone ? `Phone: ${store.phone}` : "",
      ].filter(Boolean);

      const billLines = order.shippingAddress
        ? [
            order.shippingAddress.fullName,
            order.shippingAddress.addressLine,
            order.shippingAddress.locality,
            `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
            order.shippingAddress.phone
              ? `Phone: ${order.shippingAddress.phone}`
              : "",
          ].filter(Boolean)
        : [
            customerName(customer),
            customer?.email ? `Email: ${customer.email}` : "",
            customer?.phoneNumber ? `Phone: ${customer.phoneNumber}` : "",
          ].filter(Boolean);

      const partyH = Math.max(soldLines.length, billLines.length, 3) * 12 + 28;
      doc.roundedRect(left, y, colW, partyH, 5).fill(WHITE);
      doc.roundedRect(left, y, colW, partyH, 5).strokeColor(LINE).lineWidth(0.8).stroke();
      doc
        .roundedRect(left + colW + 16, y, colW, partyH, 5)
        .fill(WHITE);
      doc
        .roundedRect(left + colW + 16, y, colW, partyH, 5)
        .strokeColor(LINE)
        .lineWidth(0.8)
        .stroke();

      doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8);
      drawText(doc, "SOLD BY", left + 10, y + 10);
      drawText(doc, "SHIP / BILL TO", left + colW + 26, y + 10);

      const blockStart = y + 26;
      doc.font("Helvetica").fontSize(8).fillColor(INK);
      soldLines.forEach((line, i) => {
        drawText(doc, line, left + 10, blockStart + i * 12, {
          width: colW - 20,
          maxHeight: 12,
        });
      });
      billLines.forEach((line, i) => {
        drawText(doc, line, left + colW + 26, blockStart + i * 12, {
          width: colW - 20,
          maxHeight: 12,
        });
      });
      y += partyH + 14;

      // Payment strip
      doc.roundedRect(left, y, contentWidth, 34, 5).fill(PAPER);
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(8);
      drawText(
        doc,
        `Payment  ·  ${order.paymentMethod || "—"}   ·   ${order.paymentStatus || "—"}`,
        left + 12,
        y + 7,
        { width: contentWidth - 24, maxHeight: 12 }
      );
      if (order.paymentId) {
        doc.font("Helvetica").fontSize(7).fillColor(MUTED);
        drawText(doc, `Transaction ID: ${order.paymentId}`, left + 12, y + 19, {
          width: contentWidth - 24,
          maxHeight: 10,
        });
      }
      y += 46;

      // Table header
      const cols = {
        no: { x: left, w: 24 },
        desc: { x: left + 24, w: 246 },
        qty: { x: left + 270, w: 36 },
        unit: { x: left + 306, w: 90 },
        total: { x: left + 396, w: contentWidth - 396 },
      };

      doc.roundedRect(left, y, contentWidth, 22, 4).fill(ACCENT_DEEP);
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(8);
      drawText(doc, "#", cols.no.x + 6, y + 7);
      drawText(doc, "Item", cols.desc.x, y + 7);
      drawText(doc, "Qty", cols.qty.x, y + 7, {
        width: cols.qty.w,
        align: "right",
      });
      drawText(doc, "Unit price", cols.unit.x, y + 7, {
        width: cols.unit.w,
        align: "right",
      });
      drawText(doc, "Amount", cols.total.x, y + 7, {
        width: cols.total.w - 8,
        align: "right",
      });
      y += 26;

      const rows = Array.isArray(items) ? items : [];
      const rowMax = 18;
      const visibleRows = rows.slice(0, rowMax);

      visibleRows.forEach((item, index) => {
        const product = item.productId || {};
        const name = product.name || "Product";
        const variant = item.variantLabel ? ` (${item.variantLabel})` : "";
        let title = `${name}${variant}`;
        if (title.length > 70) title = `${title.slice(0, 67)}...`;

        const qty = Number(item.quantity) || 0;
        const unit = Number(item.price) || 0;
        const lineTotal = unit * qty;
        const rowHeight = 18;

        if (y + rowHeight + 120 > contentBottom) {
          return;
        }

        if (index % 2 === 0) {
          doc.rect(left, y - 2, contentWidth, rowHeight).fill(PAPER);
        }

        doc.fillColor(INK).font("Helvetica").fontSize(8);
        drawText(doc, String(index + 1), cols.no.x + 6, y);
        drawText(doc, title, cols.desc.x, y, {
          width: cols.desc.w - 4,
          maxHeight: 14,
        });
        drawText(doc, String(qty), cols.qty.x, y, {
          width: cols.qty.w,
          align: "right",
        });
        drawText(doc, money(unit), cols.unit.x, y, {
          width: cols.unit.w,
          align: "right",
        });
        doc.font("Helvetica-Bold");
        drawText(doc, money(lineTotal), cols.total.x, y, {
          width: cols.total.w - 8,
          align: "right",
        });

        y += rowHeight;
      });

      if (!visibleRows.length) {
        doc.fillColor(MUTED).font("Helvetica").fontSize(8);
        drawText(doc, "No line items found for this order.", left, y);
        y += 18;
      } else if (rows.length > visibleRows.length) {
        doc.fillColor(MUTED).font("Helvetica").fontSize(7);
        drawText(
          doc,
          `Showing ${visibleRows.length} of ${rows.length} items.`,
          left,
          y
        );
        y += 14;
      }

      y += 6;
      doc
        .moveTo(left, y)
        .lineTo(right, y)
        .strokeColor(LINE)
        .lineWidth(1)
        .stroke();
      y += 12;

      // Totals
      const totalsX = left + contentWidth - 220;
      const totals = [
        ["Item total", money(order.subtotal)],
        ["Shipping", money(order.shippingFee)],
        ["Tax", money(order.tax)],
      ];

      if (Number(order.discountAmount) > 0) {
        totals.splice(1, 0, ["Discount", `− ${money(order.discountAmount)}`]);
      }

      doc.font("Helvetica").fontSize(8).fillColor(MUTED);
      for (const [label, value] of totals) {
        drawText(doc, label, totalsX, y, { width: 100 });
        doc.fillColor(INK);
        drawText(doc, value, totalsX + 100, y, { width: 110, align: "right" });
        doc.fillColor(MUTED);
        y += 14;
      }

      doc.roundedRect(totalsX - 8, y - 2, 220, 28, 5).fill(ACCENT);
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(10);
      drawText(doc, "Grand total", totalsX, y + 8, { width: 100 });
      drawText(doc, money(order.totalAmount), totalsX + 100, y + 8, {
        width: 110,
        align: "right",
      });
      y += 40;

      if (y + 40 < contentBottom) {
        doc.fillColor(MUTED).font("Helvetica").fontSize(7);
        drawText(
          doc,
          "Prices are inclusive of applicable taxes where charged. This is a computer-generated invoice and does not require a signature.",
          left,
          y,
          { width: contentWidth, maxHeight: 24 }
        );
        y += 22;

        doc.font("Helvetica-Bold").fontSize(9).fillColor(ACCENT);
        drawText(doc, "Thank you for shopping with MultiCommerce", left, y);
        doc.font("Helvetica").fontSize(7).fillColor(MUTED);
        drawText(
          doc,
          "Need help? Contact the seller using the details on this invoice, or MultiCommerce support.",
          left,
          y + 13,
          { width: contentWidth, maxHeight: 12 }
        );
      }

      // Footer
      const pageRange = doc.bufferedPageRange();
      for (let i = 0; i < pageRange.count; i += 1) {
        doc.switchToPage(pageRange.start + i);
        doc.rect(0, footerTop, pageWidth, pageHeight - footerTop).fill(INK);
        doc.fillColor(WHITE).fontSize(7).font("Helvetica");
        drawText(
          doc,
          `MultiCommerce  ·  Order ${order.orderNumber || ""}  ·  ${invoiceNo}`,
          left,
          footerTop + 12,
          { width: contentWidth, align: "center" }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
