# Vendor User Guide

Run your store: catalog, inventory, orders, payments, and marketing.

**Portal:** [Vendor login](https://multicommerce-web.vercel.app/vendor/login) · [Register](https://multicommerce-web.vercel.app/vendor/register)

**Planning (product/eng):** [Vendor services catalog](../vendor/SERVICES-CATALOG.md) · [Roadmap](../vendor/PLANNING.md)

---

## 1. Register and set up

1. Open **Vendor register** → submit details.  
2. **Verify email** with OTP.  
3. **Login** at `/vendor/login`.  
4. Create **Store Profile** (name, contact, address).  
5. Set **Shipping & Returns** fees/policies.  

You must create a store before adding products or importing a catalog.

---

## 2. Dashboard (Overview)

After login you see:

- Store name, product count, orders, stock, paid revenue  
- Charts: 7-day revenue/orders, orders by status  
- **Quick actions** to products, orders, inventory, settings  

Use the top bar **sun/moon** icons for light/dark theme, or **Settings → Appearance**.

---

## 3. Catalog — add products

### Single product
1. **Catalog → Products** → New product.  
2. Follow steps: Basics → Description → Versions (options) → Specs & photos.  
3. Choose product type (mobile, fashion, etc.) if applicable.  
4. Upload images, set MRP / discount price / stock.  
5. Save as **Active** so it appears in the shop.

### All products table
1. **Catalog → All Products**.  
2. Search / filter by status.  
3. Select rows → **Mark active**, **Mark inactive**, or **Delete selected**.  

### Bulk import
1. On Products page, download **CSV/Excel template**.  
2. Fill rows (name, category, price, options, image URLs…).  
3. Upload file → import.  
4. Fix any row errors shown after import.

---

## 4. Inventory and alerts

1. **Inventory** — review stock per product/variant.  
2. **Low Stock Alerts** — restock items that are running low.  
3. Keep **inactive** products for drafts you are not selling yet.

---

## 5. Orders and fulfillment

1. Open **Sales → Orders**.  
2. For each order update status in order:

```text
Pending → Confirmed → Processing → Shipped → Delivered
              ↘ Cancelled
Delivered → Returned (when allowed)
```

3. When **Delivered**, customer can download invoice (and you may download the same PDF).  
4. Update payment status when needed (e.g. COD collected).  

**Payments** page summarizes settlements / payment view for your store.

---

## 6. Engagement

| Section | Use it for |
|---------|------------|
| Reviews | See customer ratings; moderate if actions are available |
| Customer Support | MultiAssist inbox — order chats + product request history; reply to customers |
| Home Marketing | Add hero slider / offer / category banners for the shop home |
| Coupons | Create discount codes customers apply at checkout |

---

## 7. Account

- **Profile** — vendor profile details  
- **Settings** — theme (light/dark) + shortcuts  
- **Change password** — keep account secure  
- **Logout** — end session  

---

## 8. Payouts and weekly bank settlement (BS)

1. Open **Payouts** to see available balance.  
2. **Withdraw anytime** — request Bank or UPI payout up to available balance.  
3. **Weekly BS** — eligible earnings can be auto-settled weekly when bank details are on file (see **Seller terms**).  
4. Read **Seller terms** (`/vendor/terms`) for holds, disputes, and settlement rules.  

In-app **Getting started** (`/vendor/guide`) walks first-time sellers through store → product → orders → payouts.

---

## 9. Vendor dos and don’ts

**Do**
- Keep store + shipping info accurate  
- Use clear product titles, images, and stock  
- Move orders through statuses promptly  
- Use inactive status instead of deleting live listings when pausing  

**Don’t**
- Upload low-quality or stolen images  
- Leave stock incorrect (causes failed fulfillment)  
- Ignore Pending / Confirmed orders  
- Share your vendor login  

---

## Typical first-week checklist

- [ ] Verified email + logged in  
- [ ] Open **Getting started** walkthrough  
- [ ] Store profile complete  
- [ ] Shipping fee / free-shipping rule set  
- [ ] At least 3 active products with images  
- [ ] Test order status update on a real/demo order  
- [ ] Read seller terms (weekly BS + withdraw anytime)  
- [ ] Theme set in Settings  
