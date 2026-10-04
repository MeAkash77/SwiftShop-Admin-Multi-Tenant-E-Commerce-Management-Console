# Admin Access Matrix

**Audience:** product, engineering, security  
**Basis:** [SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md)

This is the **full access list** a marketplace Super Admin needs to manage **customers**, **vendors**, and the platform.  
Status column = current MultiCommerce app (`Have` · `Partial` · `Missing`).

Legend:

| Status | Meaning |
|--------|---------|
| **Have** | Usable in admin UI today |
| **Partial** | API and/or thin UI; not a full operator workflow |
| **Missing** | Needed for a real control plane; not built |

---

## 1. Identity & Super Admin accounts

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| Login via `/admin/login` only | Act | Have | Customer/vendor login rejected |
| Bootstrap first Super Admin | Govern | Have | `ADMIN_SETUP_SECRET` + `/admin/setup` |
| Create additional Super Admins | Govern | Have | Settings |
| List Super Admins | View | Have | Settings |
| Change own password / profile | Act | Have | Shared pages |
| Forgot password (admin portal) | Act | Have | Shared forgot flow |
| Deactivate another Super Admin | Danger | Partial | Via user status if listed; no dedicated guardrails |
| RBAC roles (Support, Finance, Trust) | Govern | Missing | Single `superAdmin` only |
| Invite admin by email | Govern | Missing | |

---

## 2. Customers (buyers)

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| List / search customers | View | Have | Customers + All Users |
| Filter active / inactive | View | Have | |
| Activate / deactivate customer | Act | Have | Blocks login when inactive |
| Open **Customer 360** record | View | Missing | Profile + orders + addresses in one page |
| View customer order history | View | Partial | Via global Orders filter, not from customer |
| View customer addresses | View | Partial | API exists; no admin UI |
| View payment methods / history | View | Partial | Via Payments / Orders |
| Reset password / send reset link | Act | Missing | Operator-triggered |
| Force logout all sessions | Act | Missing | Clear refresh tokens |
| Flag customer (fraud / VIP) | Act | Missing | |
| Support notes on customer | Act | Missing | |
| Delete customer account | Danger | Partial | API `DELETE` unused in UI |
| GDPR / data export erase | Danger | Missing | |
| Impersonate (read-only shop view) | Danger | Missing | Gated, audited if ever |

---

## 3. Vendors & stores

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| List / search vendors | View | Have | Users / Customers filters |
| List / search stores | View | Have | Stores page |
| Toggle store active / inactive | Act | Have | Soft suspend |
| Toggle vendor user active | Act | Have | |
| Approve new vendor / store | Act | Missing | No pending_review queue |
| Reject with reason | Act | Missing | |
| Suspend with reason + notify | Act | Partial | Toggle only; no reason/notify |
| Reinstate store | Act | Partial | Re-activate toggle |
| **Vendor 360** (user + store + KPIs) | View | Missing | GMV, rating, dispute rate, products |
| Edit store profile (admin override) | Act | Partial | API update; no admin form |
| Delete store | Danger | Partial | API; no UI |
| View vendor payout / bank details | View | Missing | Payouts not built |
| KYC / document review | Govern | Missing | |
| Message vendor / announce | Act | Missing | |

---

## 4. Catalog (products, categories, inventory, media)

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| List all products (cross-store) | View | Have | |
| Filter by status / store / search | View | Partial | Basic filters |
| Activate / deactivate product | Act | Have | |
| Delete product | Danger | Have | Confirm needed |
| Create / edit product as admin | Act | Missing | No admin form (vendor owns create) |
| Bulk deactivate by vendor/category | Act | Missing | |
| Create category | Govern | Have | |
| Edit category (name/slug/desc) | Govern | Partial | API PUT; UI mostly create + toggle |
| Delete category | Danger | Missing | No endpoint |
| Inventory overview | View | Have | Read-only |
| Adjust stock as admin | Act | Missing | |
| Low-stock alerts (platform) | View | Have | |
| Media library (platform / any store) | View | Missing | Media API exists; no admin UI |
| Force-remove abusive images | Act | Missing | |

---

## 5. Commerce (orders)

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| List all orders | View | Have | |
| Search by number / customer / store | View | Partial | Depends on current filters |
| Change any order status | Act | Have | Override vendor |
| Cancel / return via status | Act | Partial | Status dropdown; no dedicated flow |
| Delete order | Danger | Have | Use sparingly |
| Download invoice (Delivered) | View | Have | |
| Add internal order note | Act | Missing | |
| Open order from customer/vendor 360 | View | Missing | |
| Bulk status update | Act | Missing | |
| Dispute / return queue | Act | Missing | |

---

## 6. Money (payments, sales, payouts)

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| List payments / payment status | View | Have | Payments page |
| Mark Paid / Refunded | Act | Have | |
| Sales by store | View | Have | |
| Platform GMV / today stats | View | Have | Dashboard |
| Initiate Razorpay refund (API sync) | Act | Missing | Manual status only |
| Commission rules | Govern | Missing | |
| Vendor payout run | Govern | Missing | |
| Hold payout for suspended vendor | Act | Missing | |
| Export financial CSV | View | Missing | |

---

## 7. Trust & engagement

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| Moderate reviews (edit/delete) | Act | Have | Reviews hub |
| Hide review / restore | Act | Partial | Via manage APIs |
| Platform coupons CRUD | Act | Have | Coupons manager |
| Store-scoped coupon as admin | Act | Partial | No store picker in admin UI |
| Home marketing banners | Act | Have | Marketing |
| Support chat mediation | Act | Missing | Chat API; no admin UI |
| Report / abuse queue | Act | Missing | |

---

## 8. Insights & reports

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| Dashboard KPIs | View | Have | |
| 7-day sales chart / table | View | Have | |
| Ops snapshot (Reports) | View | Have | Thin |
| Custom date range | View | Missing | |
| CSV / PDF export | View | Missing | |
| Scheduled email reports | View | Missing | |

---

## 9. Platform configuration

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| Portal URLs / branding note | View | Partial | Hardcoded in UI copy |
| Tax / shipping platform defaults | Govern | Missing | Per-store shipping only |
| Fee / commission % | Govern | Missing | |
| Feature flags | Govern | Missing | |
| Email templates | Govern | Missing | |
| Policy pages (managed content) | Govern | Partial | Static footer pages in shop |

---

## 10. Audit & security

| Access | Level | Status | Notes |
|--------|-------|--------|-------|
| Audit log of admin actions | View | Missing | Critical for overrides |
| Login history for admins | View | Missing | |
| IP allowlist for admin | Govern | Missing | Optional later |

---

## 11. Priority access for “manage customers & vendors”

If building only the **next must-haves**, ship these first:

### Customers
1. Customer 360 (profile + orders + addresses)  
2. Deactivate / activate (already Have)  
3. Jump to order + mark refunded  
4. Operator notes + flags  

### Vendors
1. Vendor / Store 360 (KPIs + products + recent orders)  
2. Approve / Suspend with **reason**  
3. Deactivate bad products from store record  
4. Queue: pending stores + low-rated / high-dispute vendors  

### Shared
1. Global search (customer, order #, store, SKU)  
2. Audit log for status overrides, suspends, deletes  

---

## Related

- [SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md)  
- [UI-UX-PLANNING.md](./UI-UX-PLANNING.md)  
- [SERVICES-CATALOG.md](./SERVICES-CATALOG.md)  
- [PLANNING.md](./PLANNING.md)  
