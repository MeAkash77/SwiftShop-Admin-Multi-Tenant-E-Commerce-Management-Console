# Vendor System Design

**Audience:** product & engineering  
**Basis:** [SERVICES-CATALOG.md](./SERVICES-CATALOG.md) · [PLANNING.md](./PLANNING.md)  
**Platform context:** [01 — System Design](../01-SYSTEM-DESIGN.md)

This document describes **how the vendor side of MultiCommerce is designed** — current system and the target shape for planned services — so sellers can run a store safely inside a multi-tenant marketplace.

---

## 1. Purpose

A **Vendor** is a seller who:

1. Owns **one store** on the platform  
2. Lists and stocks **products** under that store  
3. **Fulfills** customer orders for that store  
4. Runs light **growth** tools (coupons, home banners)  
5. Handles **customer questions** (chat) and **reputation** (reviews)  

The design must answer vendor requirements without breaking **tenant isolation** or **server-trusted money/stock**.

### Design goals

| Goal | Meaning |
|------|---------|
| **Store as tenant** | All seller data scoped by `vendorId` + `storeId` |
| **One login → one store** | Simple MVP; staff accounts are a later wave |
| **Server trusts nothing money-related** | Prices, stock decrement, shipping, coupons recalculated on API |
| **Seller jobs first** | Onboard → catalog → fulfill → get paid (payouts planned) |
| **Extend without rewrite** | Waves A–E add fields/APIs; keep same tenancy rules |

---

## 2. Vendor in the platform

```text
                    ┌─────────────────────────────────────┐
                    │         MultiCommerce API            │
                    │  /api/vendor/auth  /store /product   │
                    │  /order /coupon /banner /review/chat │
                    └───────────────┬─────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Customer shop   │      │ Vendor portal   │      │ Admin portal    │
│ /customer/*     │      │ /vendor/*       │      │ /admin/*        │
│ buys products   │      │ runs the store  │      │ platform ops    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

| Actor | Portal | Code role | Vendor relationship |
|-------|--------|-----------|---------------------|
| Vendor | `/vendor/*` | `vendor` | Owns store; manages catalog & orders |
| Customer | `/customer/*` | `customer` | Places orders against vendor’s store |
| Super Admin | `/admin/*` | `superAdmin` | Categories, user/store oversight, future commission rules |

---

## 3. Tenancy & ownership model

```text
User (role = vendor)
   │  vendorId UNIQUE on Store
   ▼
Store  ─────────────────────────────────────────────┐
   │                                                │
   ├── Product (vendor, store, category*)           │
   │      └── variants[] (sku, stock, price)        │
   ├── Coupon (store)                               │
   ├── Banner (store)                               │
   ├── ChatSession (store / order)                  │
   └── Order (storeId) ◄── Customer User            │
          ├── OrderItem (productId, qty, price)     │
          └── [planned] tracking, payout refs       │
                                                    │
* Category is platform-owned (admin); vendor selects only.
```

### Isolation rules (non-negotiable)

1. Vendor APIs resolve **their** store via `vendorId` (or explicit `storeId` checked against ownership).  
2. Product create/update/delete only if `product.vendor` / `product.store` matches.  
3. Order list/status only if `order.storeId` matches vendor’s store.  
4. Coupons, banners, reviews, chat sessions filtered the same way.  
5. Admin may cross-tenant; vendor **never** sees another store’s data.

---

## 4. Vendor service domains

Mapped from seller requirements. Status: **Have** / **Partial** / **Target** (planned).

```text
┌──────────────────────────────────────────────────────────────────┐
│                     VENDOR SYSTEM (logical)                       │
├────────────┬────────────┬────────────┬────────────┬──────────────┤
│  Identity  │  Catalog   │ Inventory  │ Fulfillment│   Growth     │
│  & Store   │            │            │ & Money    │  & Engage    │
├────────────┼────────────┼────────────┼────────────┼──────────────┤
│ Auth       │ Products   │ Stock view │ Orders     │ Coupons      │
│ Profile    │ Variants   │ Alerts     │ Invoice    │ Banners      │
│ Store CRUD │ Bulk import│ Adjust*    │ Payments*  │ Reviews      │
│ Shipping   │ Categories │ Threshold* │ Tracking*  │ Support chat │
│ KYC*       │            │ History*   │ Payouts*   │ Stats*       │
└────────────┴────────────┴────────────┴────────────┴──────────────┘
  * = Partial today or Target in PLANNING waves A–E
```

| Domain | Vendor need | Current design | Target design |
|--------|-------------|----------------|---------------|
| **Identity** | Register, login, secure account | Vendor auth + shared OTP/password | Same; optional staff roles (Wave E) |
| **Store** | Brand + policies for checkout | Store + shipping fields | Logo, GSTIN, bank/KYC (Wave C/E) |
| **Catalog** | List sellable items fast | Product wizard, table, bulk CSV | Duplicate product; optional deals |
| **Inventory** | Know and fix stock | Read views + edit via product | Quick adjust API + threshold + email |
| **Fulfillment** | Ship and close orders | Status machine + invoice PDF | Carrier + tracking ID; pack slip |
| **Money** | Get paid for sales | Mark Paid/Refunded on order | Commission + payout ledger |
| **Growth** | Attract buyers | Coupons + home banners | Product deals; exports |
| **Engage** | Answer buyers & ratings | Chat + review delete | Seller reply on review |
| **Insights** | See performance | Client-side overview charts | Vendor stats API + CSV |

Full checklist: [SERVICES-CATALOG.md](./SERVICES-CATALOG.md).

---

## 5. High-level architecture (vendor slice)

```text
┌─────────────────────────────────────────────────────────────┐
│  Vendor portal (React)                                       │
│  VendorLayout → PanelLayout                                  │
│  Pages: Overview, Store, Shipping, Products, Inventory,      │
│         Orders, Payments, Coupons, Support, Reviews,         │
│         Marketing, Settings, Profile                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + Bearer JWT
                            │ Cookie refreshToken
┌───────────────────────────▼─────────────────────────────────┐
│  Express API                                                 │
│  authenticate → authorize('vendor') → controllers            │
│                                                              │
│  /vendor/auth/*   register, login, logout                    │
│  /auth/*          verify-email, forgot/reset/change password │
│  /store/*         create/update/get by vendor                │
│  /product/*       CRUD, bulk, vendor list                    │
│  /order/*         by store, status, payment, invoice         │
│  /coupon/*  /banner/*  /review/*  /chat/*  /user/*           │
│  [target] /dashboard/vendor  /product/:id/stock  /payouts    │
└───────┬─────────────┬──────────────┬─────────────┬──────────┘
        ▼             ▼              ▼             ▼
   MongoDB        Cloudinary      Nodemailer    Razorpay*
   (tenant data)  (product imgs)  (OTP, alerts) (customer pay;
                                                 vendor payouts later)
```

\* Today Razorpay settles **customer → platform**. Vendor **payouts** are a separate ledger (Wave C), not the same as checkout.

---

## 6. Data design (vendor-owned)

### 6.1 Core entities (current)

| Entity | Key fields for vendor | Ownership |
|--------|----------------------|-----------|
| **User** | role=`vendor`, email, name, phone, isVerified | Self |
| **Store** | storeName, contact, address, shippingFee, freeShippingAbove, policies, vendorId **unique** | Vendor |
| **Product** | name, price/MRP, images, variants, stock, status, category, store, vendor | Vendor |
| **Order** | storeId, items, totals, orderStatus, paymentStatus | Store (customer places) |
| **Coupon** | code, type, value, store, limits | Store |
| **Banner** | type, image, link, store | Store |
| **Review** | product, rating, text | On vendor’s product |
| **ChatSession** | store/order scoped messages | Store |

### 6.2 Target extensions (do not invent UI until built)

| Extension | Wave | Suggested fields / collection |
|-----------|------|-------------------------------|
| Shipment tracking | A1 | `Order.carrier`, `Order.trackingId`, `Order.shippedAt` |
| Low-stock threshold | A3 | `Store.lowStockThreshold` (default 10) and/or per product |
| Stock adjust log | B3 | `StockAdjustment { product, variantSku, delta, reason, vendor, at }` |
| KYC / bank | C1 | `Store.gstin`, `Store.bankAccount`, `Store.ifsc`, `Store.kycStatus` |
| Commission | C2 | Platform `Settings.commissionPercent` |
| Payout | C3 | `Payout { store, periodFrom, periodTo, gross, fee, net, status }` |
| Review reply | D3 | `Review.vendorReply`, `Review.repliedAt` |

Indexes stay ownership-first: `(store, …)`, `(vendor, …)`, unique `vendorId` on stores.

---

## 7. API design (vendor surface)

### 7.1 Auth

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/vendor/auth/register` | Create vendor user |
| POST | `/api/vendor/auth/login` | Issue access JWT + refresh cookie |
| POST | `/api/vendor/auth/logout` | Clear session |
| POST | `/api/auth/verify-email` | OTP (shared) |
| POST | `/api/auth/forgotPassword` · reset · change | Shared, portal-branded UI |

### 7.2 Store & catalog

| Method | Path | Purpose |
|--------|------|---------|
| POST/PUT/GET | `/api/store…` | Create / update / get by vendor |
| CRUD + bulk | `/api/product…` | Catalog; always scoped to vendor store |
| GET | `/api/category` | Read-only pick list |

### 7.3 Orders & money (current)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/order/store/:storeId` | List store orders |
| PUT | `/api/order/status/:id` | Advance fulfillment status |
| PUT | `/api/order/payment/:id` | Mark Paid / Refunded (manual) |
| GET | `/api/order/:id/invoice` | PDF invoice |

### 7.4 Engagement

| Area | Paths |
|------|--------|
| Coupons | `/api/coupon` manage (store-scoped) |
| Banners | `/api/banner` manage |
| Reviews | `/api/review/manage`, DELETE `/api/review/:id` |
| Chat | `/api/chat/vendor/sessions`, reply, resolve |

### 7.5 Target APIs (planning)

| Wave | Endpoint (proposed) | Behavior |
|------|---------------------|----------|
| A1 | `PUT /order/tracking/:id` | Set carrier + tracking; vendor-owned order only |
| B1 | `PATCH /product/:id/stock` | Adjust base or variant stock by delta |
| A3 | `PUT /store/settings/inventory` | `lowStockThreshold` |
| D1 | `GET /dashboard/vendor` | Server aggregates for overview |
| D2 | `GET /order/store/:id/export` | CSV by date range |
| C3 | `GET/POST /payout…` | Ledger list; admin marks paid |

All target routes: `authenticate` + `authorize('vendor')` + ownership check.

---

## 8. Frontend information architecture

```text
/vendor
├── Auth (public)
│   ├── /login  /register  /forgot-password
│   └── (shared) verify-email, reset-password, change-password
└── App shell (ProtectedRoute role=vendor)
    ├── Overview              KPIs + charts
    ├── Store
    │   ├── Store Profile
    │   └── Shipping & Returns
    ├── Catalog
    │   ├── Products (wizard)
    │   ├── All Products (table)
    │   ├── Inventory
    │   └── Low Stock Alerts
    ├── Sales
    │   ├── Orders
    │   ├── Payments
    │   └── Coupons
    ├── Engagement
    │   ├── Customer Support
    │   ├── Reviews
    │   └── Home Marketing
    └── Account
        ├── Settings (theme)
        ├── Profile
        └── Change password
```

Shell: `VendorLayout.jsx` → shared `PanelLayout` (sidebar groups match domains above).

**UX principle:** one job per page; overview only for “what needs attention” (orders, low stock), not a second admin dashboard.

---

## 9. Critical flows

### 9.1 Onboarding

```text
Register (vendor) → Email OTP → Login
    → Create Store (required)
    → Set Shipping & Returns
    → Add first products (or bulk import)
    → Overview ready
```

Gate: **no store ⇒ no products / import.** Enforced in UI and recommended in API.

### 9.2 Catalog publish

```text
Vendor drafts product → images (Cloudinary) → variants/stock
    → status Active → visible on customer shop (category + store)
    → Inactive hides from shop (soft draft)
```

### 9.3 Order fulfillment (current)

```text
Customer checkout (per store) → Order Created (stock decremented)
    → Vendor: Pending → Confirmed → Processing → Shipped → Delivered
         ↘ Cancelled                    ↘ Returned (after Delivered)
    → Payment: Pending | Paid | Refunded (manual / Razorpay on customer side)
    → Invoice PDF when rules allow
```

### 9.4 Target fulfillment (Wave A)

```text
… → Processing → Shipped
                   │
                   ├─ set carrier + trackingId
                   └─ customer order page shows tracking link/text
```

### 9.5 Target money (Wave C)

```text
Paid orders in period → gross sales
    → minus platform commission
    → Payout row (Pending)
    → Admin marks Paid after bank transfer
    → Vendor Payments / Payouts UI shows status
```

Never label customer Razorpay capture as “vendor payout.”

---

## 10. Security & trust boundaries

| Concern | Design |
|---------|--------|
| Authentication | Vendor JWT; refresh httpOnly cookie |
| Authorization | `authorize('vendor')` on mutating routes |
| Ownership | Every write checks store/vendor match |
| Pricing | Server recalculates line totals, tax, shipping, coupon |
| Stock | Decrement on order create; future adjust API audited |
| Uploads | Multer → Cloudinary; bulk spreadsheet multer |
| Cross-tenant | Vendor cannot pass another `storeId` and succeed |
| Admin override | Super Admin only for categories & platform commission |

---

## 11. Non-functional requirements (vendor)

| Area | Requirement |
|------|-------------|
| **Correctness** | Wrong stock/price must not be client-trusted |
| **Isolation** | Zero leakage across stores under concurrent vendors |
| **Latency** | Portal lists (products/orders) usable under pagination; avoid loading full catalog client-side for stats long-term (→ D1) |
| **Availability** | Vendor portal same API as shop; cold starts documented separately |
| **Audit** | Order status changes and future stock/payout actions should be attributable to vendor user |
| **Simplicity** | One store / one owner until Wave E staff roles |

---

## 12. Integration points

```text
Vendor portal
    │
    ├─► API ─► MongoDB (source of truth)
    ├─► API ─► Cloudinary (product / banner images)
    ├─► API ─► Email (OTP; later low-stock / new-order alerts)
    │
    └─► Indirect: Customer shop + Razorpay
            (creates demand & Paid status; not vendor settlement)
```

Admin sets **categories** and (later) **commission**; vendor consumes them.

---

## 13. Current vs target system (summary)

| Layer | Current | Target (per PLANNING) |
|-------|---------|------------------------|
| Auth & store | Complete | + KYC/bank, logo, staff |
| Catalog | Strong (wizard + bulk) | + deals, duplicate |
| Inventory | Monitor + edit via product | + adjust API, threshold, email |
| Fulfillment | Status + invoice | + tracking, pack slip |
| Money | Order payment mark | + commission, payout ledger, webhooks |
| Insights | Client charts | + vendor dashboard API, CSV |
| Engage | Chat + review delete | + review reply |

Build order: **Wave A → B → C → D → E** ([PLANNING.md](./PLANNING.md)).

---

## 14. Design principles (vendor contributors)

1. **Store is the tenant boundary** — never query “all products” as a vendor without `store`/`vendor` filter.  
2. **Have / Partial / Missing** in SERVICES-CATALOG is the product truth — update it when shipping.  
3. **Don’t fake payouts** in copy or UI until Wave C exists.  
4. **Thin vertical slices** — model field + API + vendor page + customer display if needed.  
5. **Align with platform design** — same auth cookies, pricing helpers, and invoice rules as [01-SYSTEM-DESIGN](../01-SYSTEM-DESIGN.md).

---

## Related documents

| Doc | Use |
|-----|-----|
| [SCHEMA-DESIGN.md](./SCHEMA-DESIGN.md) | Schema design workflow, ER, state machines |
| [UI-UX-PLANNING.md](./UI-UX-PLANNING.md) | Seller Hub UI/UX plan & phases |
| [SERVICES-CATALOG.md](./SERVICES-CATALOG.md) | Requirement ↔ status matrix |
| [PLANNING.md](./PLANNING.md) | Build waves & sprint template |
| [VENDOR.md](../user-guides/VENDOR.md) | Operator how-to |
| [01-SYSTEM-DESIGN.md](../01-SYSTEM-DESIGN.md) | Full platform architecture |
| [02-PROJECT-FLOW.md](../02-PROJECT-FLOW.md) | End-to-end flows |
| [03-DATABASE-MODULES.md](../03-DATABASE-MODULES.md) | Schema detail |
| [04-API-MODULES.md](../04-API-MODULES.md) | Route map |
| [05-FRONTEND-ARCHITECTURE.md](../05-FRONTEND-ARCHITECTURE.md) | React shells |
