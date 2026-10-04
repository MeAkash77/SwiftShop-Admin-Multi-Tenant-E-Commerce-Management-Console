# Admin System Design

**Audience:** product & engineering  
**Basis:** [ACCESS-MATRIX.md](./ACCESS-MATRIX.md) · [SERVICES-CATALOG.md](./SERVICES-CATALOG.md) · [PLANNING.md](./PLANNING.md)  
**Platform context:** [01 — System Design](../01-SYSTEM-DESIGN.md)  
**Vendor side:** [vendor/SYSTEM-DESIGN.md](../vendor/SYSTEM-DESIGN.md)

This document describes **how the admin / platform-operator side of MultiCommerce is designed** — current system and the target shape — so operators can manage **customers**, **vendors**, and **marketplace trust** without breaking tenant isolation.

---

## 1. Purpose — think as Super Admin

A **Super Admin** is not a seller. They are the **marketplace operator**. Daily jobs:

| Job | Question they ask |
|-----|-------------------|
| **Trust & safety** | Is this vendor / listing / customer harming the marketplace? |
| **People** | Who can log in? Who is blocked? Who needs help? |
| **Vendor lifecycle** | Pending → approved → suspended → reinstated |
| **Customer care** | Find order, refund, block abuse, support handoff |
| **Catalog quality** | Bad products, wrong categories, stock anomalies |
| **Money oversight** | Payments stuck, refunds, future commissions / payouts |
| **Platform health** | GMV, orders today, low stock, dispute spikes |
| **Configuration** | Categories, coupons, banners, (future) fees & policies |

### Design goals

| Goal | Meaning |
|------|---------|
| **Cross-tenant visibility** | Admin sees *all* stores, customers, orders — vendors see only their store |
| **Act, don’t only watch** | Record pages expose high-frequency actions (suspend, refund, force status) |
| **Least surprise for vendors** | Overrides are logged; vendors feel fair process |
| **Server-trusted money** | Admin UI never invents amounts; API recalculates |
| **Auditability** | Who changed what (target); critical for disputes |
| **Extend to RBAC later** | Today: one `superAdmin`. Tomorrow: Support / Finance / Ops roles |

---

## 2. Panel type: Marketplace Control Plane

Industry pattern for multi-vendor platforms (Amazon ops, Shopify Marketplace admin layers, Webkul/MarketCube operator consoles):

```text
┌──────────────────────────────────────────────────────────┐
│                 MARKETPLACE CONTROL PLANE                  │
│  Home · Queues · People · Vendors · Catalog · Commerce   │
│  Money · Trust · Content · Settings · Audit                │
└────────────────────────────┬─────────────────────────────┘
                             │ overrides / policies
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   Customer shop       Vendor Hub          Payments / email
   (buyers)            (sellers)           (Razorpay, etc.)
```

| Layer | Who | Panel style |
|-------|-----|-------------|
| Customer | Buyers | Shop UX |
| Vendor | Sellers | Shopify-plain store admin |
| **Admin** | Operators | **Control plane** — queues, records, overrides |

**Do not** copy Vendor Hub 1:1. Admin needs: **global search**, **queues** (approvals, disputes, alerts), **entity records** (customer / vendor / order), **bulk actions**, and **platform settings**.

---

## 3. Actors & boundaries

```text
                    ┌─────────────────────────────────────┐
                    │         MultiCommerce API            │
                    │  /api/admin/auth  /dashboard /user   │
                    │  /store /product /order /category …  │
                    └───────────────┬─────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Customer shop   │      │ Vendor portal   │      │ Admin portal    │
│ role: customer  │      │ role: vendor    │      │ role: superAdmin│
│ own cart/orders │      │ own store only  │      │ all tenants     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

| Rule | Detail |
|------|--------|
| Role | `superAdmin` only (MVP). No junior admin yet. |
| Auth | `/admin/login` only; customer/vendor login rejects admins |
| Cookies | Portal-scoped refresh (`refreshToken_admin`) |
| Tenancy | Admin queries are **not** filtered by `storeId` unless chosen in UI |
| Write safety | Destructive actions confirm; deletes rare; prefer suspend |

---

## 4. Domain map (what admin owns)

| Domain | Responsibility | Primary entities |
|--------|----------------|------------------|
| **A. Identity & access** | Who exists, who can sign in | User, Super Admin accounts |
| **B. Customers** | Buyer lifecycle & care | Customer user, addresses, orders |
| **C. Vendors & stores** | Seller onboarding & health | Vendor user, Store, KYC (planned) |
| **D. Catalog** | Marketplace quality | Product, Category, Inventory, Media |
| **E. Commerce** | Order truth across stores | Order, OrderItem, Invoice |
| **F. Money** | Payment state & future payouts | Payment fields, Refunds, Commission (planned) |
| **G. Trust** | Reviews, disputes, chat mediation | Review, Chat, Appeals (planned) |
| **H. Growth** | Platform merchandising | Banner, Coupon (platform-wide) |
| **I. Insights** | Decide where to intervene | Dashboard stats, Reports |
| **J. Platform config** | Rules of the marketplace | Settings, fees, policies (planned) |
| **K. Audit** | Prove what ops did | AuditLog (planned) |

---

## 5. Access model (summary)

Full matrix: **[ACCESS-MATRIX.md](./ACCESS-MATRIX.md)**.

### 5.1 Capability levels

| Level | Meaning | Example |
|-------|---------|---------|
| **View** | Read lists / detail | See all customers |
| **Act** | Day-to-day ops | Suspend vendor, mark refunded |
| **Govern** | Policy / structure | Categories, create Super Admin |
| **Danger** | Irreversible / high risk | Delete order, delete user |

### 5.2 Customer access (admin needs)

| Capability | Why |
|------------|-----|
| Search & open customer record | Support calls |
| See orders, payments, addresses | Resolve “where is my order?” |
| Activate / deactivate account | Abuse, fraud |
| Force logout / reset path | Account recovery |
| (Target) Impersonate read-only or open shop-as | Rare; gated |
| (Target) Notes & flags on customer | Support history |

### 5.3 Vendor access (admin needs)

| Capability | Why |
|------------|-----|
| Search vendors & stores | Ops |
| Approve / reject / suspend store | Onboarding & trust |
| See store KPIs (GMV, disputes, rating) | Decide intervene |
| View / force product status | Bad listings |
| Override order status across stores | Stuck fulfillment |
| (Target) Commission & payout controls | Money truth |
| (Target) Document / KYC review | Compliance |

### 5.4 Target RBAC (later wave)

| Role | Typical access |
|------|----------------|
| **Super Admin** | Everything |
| **Ops / Support** | Customers, orders, chat; no platform fees |
| **Trust & Safety** | Vendors, products, reviews, suspend |
| **Finance** | Payments, refunds, payouts, reports export |
| **Catalog Manager** | Categories, banners, coupons; limited people |

Until RBAC ships: every `superAdmin` has full access — treat actions as **logged** (planned AuditLog).

---

## 6. Core workflows

### 6.1 Vendor onboarding (target)

```text
Vendor registers → OTP → creates store
    → status: pending_review (target)
        → Admin queue: Approve | Request info | Reject
            → Approve → store.isActive = true → vendor can sell
            → Suspend later → store.isActive = false + reason
```

**Today:** register → store active; admin can toggle `isActive` on store/user.

### 6.2 Customer care

```text
Search customer → open record
  → Orders tab → open order → change status / refund / invoice
  → If abuse → deactivate user
```

### 6.3 Bad listing

```text
Product report / review spike / search SKU
  → Open product → Deactivate or Delete
  → Optional: notify vendor (planned)
```

### 6.4 Stuck payment / order

```text
Payments or Orders filter
  → Mark Paid / Refunded or status override
  → Confirm; prefer vendor-first when possible
```

---

## 7. Data & API shape

### 7.1 Auth

| Endpoint | Use |
|----------|-----|
| `GET /api/admin/auth/status` | Setup required? |
| `POST /api/admin/auth/login` | Super Admin only |
| `POST /api/admin/auth/logout` | Clear admin cookie |
| `POST /api/admin/auth/create` | Bootstrap / add Super Admin |
| `GET /api/admin/auth/admins` | List Super Admins |

### 7.2 Cross-tenant reads/writes (existing pattern)

Admin uses shared routers with `authorize("superAdmin", …)`:

- Users: list, status, delete  
- Stores / products / orders / categories / coupons / banners / reviews  
- Dashboard: `GET /api/dashboard/stats`

### 7.3 Planned admin-specific APIs

| API | Purpose |
|-----|---------|
| `GET /admin/customers/:id` | Customer 360 (profile + orders + addresses) |
| `GET /admin/vendors/:id` | Vendor 360 (user + store + KPIs + products) |
| `POST /admin/stores/:id/approve` | Onboarding decision |
| `POST /admin/stores/:id/suspend` | With reason |
| `GET /admin/queues/*` | Approvals, disputes, low-stock, refunds |
| `GET|POST /admin/audit` | Audit trail |
| `GET /admin/reports/export` | CSV |

---

## 8. Security rules

| Rule | Detail |
|------|--------|
| Portal isolation | Admin JWT/cookie only via `/admin/*` |
| No tenant leak to vendors | Vendor APIs remain store-scoped |
| Confirm danger | Delete user/order/product requires confirm modal |
| Secrets | `ADMIN_SETUP_SECRET` only for first bootstrap |
| Rate / abuse | Login rate limits; audit failed admin logins (planned) |
| PII | Customer emails/phones only in admin; never expose to other vendors |

---

## 9. Relationship to Vendor Hub

| Concern | Vendor Hub | Admin Control Plane |
|---------|------------|---------------------|
| Scope | One store | All stores |
| Visual | Shopify-plain green | Calm ops console (neutral + one accent) |
| Home | Seller tasks | Platform queues + health |
| Money | Customer payment status | Refunds, sales by store, future payouts |
| Catalog | Own products | All products + categories |
| Support | Vendor inbox | Mediation + customer 360 |

Admin should be able to **open the same order/product a vendor sees**, with extra override controls.

---

## 10. Non-goals (MVP / near term)

- Full ERP / accounting suite  
- Built-in email marketing CRM  
- Real-time warehouse WMS  
- Per-country tax engine (configure later)  
- Impersonate vendor write access (read-only first if ever)

---

## 11. Success metrics

| Metric | Signal |
|--------|--------|
| Time to find customer order | &lt; 30s from Home search |
| Vendor approve cycle | Queue clears daily |
| Unsafe listing dwell time | Hours not days |
| Accidental deletes | Near zero (confirm + audit) |
| Dual-portal sessions | Customer/vendor/admin tabs don’t wipe each other |

---

## Related

- [ACCESS-MATRIX.md](./ACCESS-MATRIX.md) — every permission  
- [UI-UX-PLANNING.md](./UI-UX-PLANNING.md) — screens & nav  
- [SERVICES-CATALOG.md](./SERVICES-CATALOG.md) — Have / Partial / Missing  
- [PLANNING.md](./PLANNING.md) — build waves  
- [user-guides/ADMIN.md](../user-guides/ADMIN.md) — operator how-to  
