# Vendor services catalog

**Audience:** product & engineering planning (not end-user how-to).  
**Question:** As a vendor, what services do I need — and does MultiCommerce provide them?

Status key:

| Status | Meaning |
|--------|---------|
| **Have** | Usable in vendor portal today |
| **Partial** | Exists but thin / manual / missing depth |
| **Missing** | Not in product yet (backlog) |

---

## 1. Account & access

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| Register as seller | **Have** | `/vendor/register` · `POST /api/vendor/auth/register` | Creates `role=vendor` |
| Email OTP verify | **Have** | Shared `/auth/verify-email` | Portal-aware redirect |
| Login / logout | **Have** | `/vendor/login` · vendor auth API | JWT + refresh cookie |
| Forgot / reset password | **Have** | `/vendor/forgot-password` | Shared auth endpoints |
| Change password | **Have** | `/vendor/change-password` | Authenticated |
| Edit profile (name, phone) | **Have** | `/vendor/profile` | Email read-only |
| Staff / sub-users / roles | **Missing** | — | One login per seller |
| Session / device management | **Missing** | — | Optional later |

---

## 2. Store identity & policies

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| Create / edit one store | **Have** | `/vendor/store` · `/api/store` | One store per vendor (by design) |
| Store name, contact, address, description | **Have** | Store model + UI | — |
| Store logo / brand assets | **Partial** | Media library exists; store logo field still missing | Use `/vendor/media` for product photos |
| Shipping fee + free-shipping threshold | **Have** | `/vendor/shipping` | Used at checkout |
| Estimated delivery days + policy text | **Have** | Shipping & returns page | — |
| Return policy text | **Have** | Same | — |
| Shipping zones / weight / carrier rates | **Missing** | — | Flat fee only |
| Business hours | **Missing** | — | — |
| GST / tax IDs / compliance fields | **Missing** | — | Needed for India marketplace maturity |
| KYC / bank details | **Missing** | — | Required before real payouts |
| Multi-store per vendor | **Missing** | Schema enforces one | Intentional unless product changes |

---

## 3. Catalog (products)

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| Add / edit product | **Have** | `/vendor/products` wizard | Types, variants, specs, images |
| Variants / options + stock per variant | **Have** | Product model + UI | Auto SKU |
| Cloudinary image upload | **Have** | Product form | — |
| Activate / deactivate listings | **Have** | Product + bulk table | — |
| All-products table (search / bulk) | **Have** | `/vendor/product-table` | Mark active/inactive/delete |
| Bulk CSV/Excel import | **Have** | Template + import API | — |
| Pick category | **Have** (read) | Categories from admin | Vendor cannot create categories |
| Own category taxonomy | **Missing** | Admin-only create | Curated marketplace choice |
| Product drafts / scheduling | **Partial** | Inactive ≈ draft | No publish schedule |
| Duplicate product | **Missing** | — | UX speed-up |

---

## 4. Inventory

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| See stock levels | **Have** | `/vendor/inventory` | Per product / variant |
| Edit stock | **Partial** | Via product form only | No quick adjust API/UI |
| Low-stock list | **Partial** | `/vendor/alerts` (≤10 client filter) | No configurable threshold |
| Low-stock email / push | **Missing** | — | In-app list only |
| Stock reservation on checkout | **Partial** | Decrements on order create | No hold/expiry model |
| Multi-warehouse | **Missing** | — | — |

---

## 5. Orders & fulfillment

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| List store orders | **Have** | `/vendor/orders` · `GET /order/store/:storeId` | — |
| Advance order status | **Have** | Status machine in UI + API | Pending → … → Delivered |
| Cancel / mark returned | **Partial** | Via status | No dedicated refund workflow |
| Download invoice PDF | **Have** | Orders / payments | Shared invoice service |
| Packing slip / pick list | **Missing** | — | — |
| Carrier + tracking number | **Missing** | Status “Shipped” only | High customer ask |
| Partial ship / split fulfill | **Missing** | — | — |
| Print label / courier integrate | **Missing** | — | — |

---

## 6. Money (payments & payouts)

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| See order payment status | **Have** | `/vendor/payments` | Paid / Pending |
| Mark COD collected / refunded | **Partial** | Manual payment status update | Not auto from gateway |
| Customer checkout (Razorpay / COD) | **Have** | Customer side | Money to platform checkout |
| Vendor payouts / settlements | **Have** | `/vendor/payouts`, admin `/admin/payouts` | Manual withdraw anytime + admin pay/reject; seller terms cover weekly BS policy |
| Commission / fee ledger | **Missing** | — | — |
| Razorpay webhooks / auto refund | **Missing** | — | Documented OOS in team plan |
| Sales export (CSV) | **Missing** | Overview charts only | — |

---

## 7. Growth (marketing & promos)

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| Discount coupons | **Have** | `/vendor/coupons` | % / fixed, min order, expiry |
| Shop home banners | **Have** | `/vendor/marketing` | Slider / offer / category tiles |
| Flash sale / BOGO / product deals | **Missing** | Coupons only | — |
| Campaign calendar / A/B | **Missing** | — | — |
| Storefront SEO fields | **Missing** | — | — |

---

## 8. Customers & reputation

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| In-app support chat | **Have** | `/vendor/support` (MultiAssist) | Reply / resolve / product requests |
| Email escalation from chat | **Missing** | Inbox only | — |
| Product reviews list | **Have** | `/vendor/reviews` | Filter own products |
| Delete inappropriate review | **Have** | DELETE review | — |
| Public seller reply to review | **Missing** | — | — |
| Customer CRM / segments | **Missing** | — | — |

---

## 9. Insights & account settings

| Service vendors want | Status | In app today | Notes |
|----------------------|--------|--------------|-------|
| Overview KPIs + charts | **Partial** | `/vendor` Overview | Client-side aggregate; no vendor dashboard API |
| Reports / exports | **Missing** | Admin has reports | Vendor backlog |
| Theme (light/dark) | **Have** | Settings + header | Local preference |
| Notification preferences | **Missing** | Toasts only | — |
| Push / email order alerts | **Missing** | — | Team plan OOS |

---

## Portal map (implemented routes)

| Area | Routes |
|------|--------|
| Auth | `/vendor/login`, `/register`, `/forgot-password` |
| Home | `/vendor` |
| Store | `/vendor/store`, `/shipping` |
| Catalog | `/vendor/products`, `/product-table`, `/inventory`, `/alerts` |
| Sales | `/vendor/orders`, `/payments`, `/coupons` |
| Engage | `/vendor/support`, `/reviews`, `/marketing` |
| Account | `/vendor/settings`, `/profile`, `/change-password` |

Shell: `frontend/src/layouts/VendorLayout.jsx`

---

## Summary count (planning snapshot)

| Status | Count (approx.) |
|--------|-----------------|
| **Have** | Strong core: auth, store, catalog, orders, coupons, banners, chat, reviews |
| **Partial** | Inventory ops, analytics, payment marking, cancel/return depth |
| **Missing** | Payouts, KYC/bank, tracking IDs, staff roles, tax, exports, push alerts |

Next actions → [PLANNING.md](./PLANNING.md)
