# Admin Services Catalog

**Audience:** product & engineering  
**Status key:** Have · Partial · Missing  
**Updated against:** live admin portal routes + APIs (see inventory in planning chats / codebase)

Pair with [ACCESS-MATRIX.md](./ACCESS-MATRIX.md) for permission-level detail.

---

## A. Access & accounts

| Service | Status | Where today |
|---------|--------|-------------|
| Admin login / logout | Have | `/admin/login`, `/api/admin/auth` |
| First admin setup | Have | `/admin/setup` |
| Create Super Admins | Have | Settings |
| Admin profile / password | Have | Profile, Change password |
| RBAC (Support/Finance/Trust) | Missing | — |
| Admin invite email | Missing | — |

---

## B. Customers

| Service | Status | Where today |
|---------|--------|-------------|
| Customer list / filter | Have | Customers, All Users |
| Activate / deactivate | Have | Status toggle |
| Customer 360 record | Have | `/admin/customers/:id` |
| Addresses in admin UI | Partial | API only |
| Operator notes / flags | Partial | Local notes on deactivate |
| Force reset / logout | Missing | — |
| Delete customer UI | Partial | API unused |

---

## C. Vendors & stores

| Service | Status | Where today |
|---------|--------|-------------|
| Store list / toggle active | Have | Stores |
| Vendor user toggle | Have | Users / Customers |
| Approval queue | Partial | Suspended filter + Home queue |
| Suspend with reason | Have | Reason modal |
| Vendor / Store 360 + KPIs | Have | `/admin/stores/:id` |
| Admin edit store form | Partial | API |
| KYC / documents | Missing | — |
| Notify vendor on action | Missing | — |

---

## D. Catalog

| Service | Status | Where today |
|---------|--------|-------------|
| All products list / status / delete | Have | Products |
| Admin create/edit product | Missing | Vendor owns forms |
| Categories create / toggle | Have | Categories |
| Category full edit | Partial | Thin UI |
| Inventory overview | Have | Inventory |
| Admin stock adjust | Missing | — |
| Stock alerts | Have | Alerts |
| Media moderation UI | Missing | Media API exists |

---

## E. Commerce & money

| Service | Status | Where today |
|---------|--------|-------------|
| All orders + status override | Have | Orders |
| Order detail page | Partial | Mostly list |
| Delete order / invoice | Have | Orders |
| Payments mark Paid/Refunded | Have | Payments |
| Sales by store | Have | Sales |
| Razorpay-linked refund | Missing | — |
| Commissions / payouts | Missing | — |
| Financial export | Missing | — |

---

## F. Trust & content

| Service | Status | Where today |
|---------|--------|-------------|
| Reviews moderation | Have | Reviews |
| Platform coupons | Have | Coupons |
| Home banners | Have | Marketing |
| Chat mediation UI | Missing | Chat API |
| Abuse / report queue | Missing | — |

---

## G. Insights & config

| Service | Status | Where today |
|---------|--------|-------------|
| Dashboard stats | Have | Dashboard |
| Reports snapshot | Partial | Reports |
| Date-range / CSV export | Missing | — |
| Platform settings (fees, policies) | Missing | — |
| Audit log | Missing | — |
| Global search | Have | Top bar (Control Plane) |
| Home queues | Have | Dashboard / Home |
| Customer 360 record | Have | `/admin/customers/:id` |
| Store / Vendor 360 + KPIs | Have | `/admin/stores/:id` |
| Suspend with reason | Have | Modal on customers & stores |

---

## Summary counts (approx.)

| Status | Count (services above) |
|--------|-------------------------|
| Have | ~22 |
| Partial | ~10 |
| Missing | ~25 |

**Read:** strong **oversight tables**; weak **360 records, queues, audit, money governance**.

---

## Related

- [PLANNING.md](./PLANNING.md) — what to build next  
- [UI-UX-PLANNING.md](./UI-UX-PLANNING.md) — how it should feel  
- [SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md) — architecture  
