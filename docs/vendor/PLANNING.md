# Vendor services — planning roadmap

Use this after [SERVICES-CATALOG.md](./SERVICES-CATALOG.md).  
Goal: plan **before** building — one service slice at a time.

---

## Planning principles

1. **Vendor job first** — each slice must answer: “What can the seller finish faster or more safely?”  
2. **Don’t break tenancy** — always scope by `vendor` / `store`.  
3. **Ship thin verticals** — API + portal UI + short note in catalog status.  
4. **Money last among “nice”** — payouts need KYC/bank + ledger; don’t fake “payouts” in UI copy.  
5. **Update docs when done** — flip status in SERVICES-CATALOG; check off below.

---

## Priority waves

### Wave A — Trust & fulfillment (customer-visible)

| # | Service | Why vendors want it | Suggested scope (MVP) | Depends on |
|---|---------|---------------------|------------------------|------------|
| A1 | **Shipment tracking fields** | Customers ask “where is my order?” | Carrier name + tracking ID on order; show on customer order detail | Order model + VendorOrders UI |
| A2 | **Packing / pick helpers** | Faster warehouse day | Printable order summary (items + qty + address) | Orders API |
| A3 | **Configurable low-stock threshold** | Restock before stockouts | Per-store or per-product threshold; alerts page uses it | Store/product fields |

### Wave B — Inventory ops

| # | Service | Why vendors want it | Suggested scope (MVP) | Depends on |
|---|---------|---------------------|------------------------|------------|
| B1 | **Quick stock adjust** | Fix stock without full product edit | `PATCH` stock on product/variant + inventory row actions | Product API |
| B2 | **Low-stock email** | Don’t live in the portal all day | Daily or on-threshold email to store email | Mailer + job/cron |
| B3 | **Stock history (optional)** | Audit mistakes | Append-only adjust log | B1 |

### Wave C — Money (marketplace maturity)

| # | Service | Why vendors want it | Suggested scope (MVP) | Depends on |
|---|---------|---------------------|------------------------|------------|
| C1 | **Bank / KYC profile fields** | Ready for payouts | Store or vendor profile: account, IFSC, GSTIN (store only) | Store/user model |
| C2 | **Commission rules (admin)** | Platform takes a cut | Admin % or flat; show estimated fee on vendor payments | Admin settings |
| C3 | **Payout ledger** | “When do I get paid?” | Periods + status (Pending/Paid) + amount; manual mark paid first | C1–C2 |
| C4 | **Gateway webhooks / auto refund** | Less manual payment status | Razorpay webhook → Paid/Refunded | Order payment flow |

### Wave D — Insights & growth

| # | Service | Why vendors want it | Suggested scope (MVP) | Depends on |
|---|---------|---------------------|------------------------|------------|
| D1 | **Vendor stats API** | Reliable charts (not client-only) | `/api/dashboard/vendor` or store-scoped stats | Auth vendor |
| D2 | **Sales CSV export** | Accounting / Excel | Date range → orders/payments CSV | Orders |
| D3 | **Seller reply on reviews** | Reputation | Reply text + show on PDP | Review model |
| D4 | **Product-level deals** | Beyond coupons | Optional deal price window on product | Catalog |

### Wave E — Team & compliance (later)

| # | Service | Why vendors want it | Suggested scope (MVP) | Depends on |
|---|---------|---------------------|------------------------|------------|
| E1 | Staff accounts | Warehouse vs owner | Invite email + limited role | Auth redesign |
| E2 | Multi-warehouse | Scale sellers | Location + stock by location | Inventory |
| E3 | Shipping zones | Fairer freight | PIN/zone rate table | Checkout shipping |
| E4 | Store logo / brand kit | Stronger storefront | Image upload on store | Cloudinary |
| E5 | Push / order notifications | Instant alerts | Web push or email on new order | Notify infra |

---

## Explicitly out of scope (for now)

Documented elsewhere (`docs/08-TEAM-5WEEK-PLAN.md`) and still valid until Wave C/E:

- Full automated vendor **payouts** without KYC  
- **Push notifications** as a default  
- **Multi-store** per vendor (schema is one-store)  

Do not mark these “Have” in UI copy until the slice ships.

---

## Suggested first planning sprint (2 weeks)

| Day focus | Outcome |
|-----------|---------|
| 1–2 | Confirm A1 fields + customer display mock |
| 3–5 | Implement A1 (tracking) end-to-end |
| 6–7 | B1 quick stock adjust |
| 8–9 | A3 threshold + alerts page |
| 10 | Update SERVICES-CATALOG statuses + short note in VENDOR.md |

---

## Checklist template (copy per service)

```text
Service:
Problem for vendor:
In-app today (Have/Partial/Missing):
MVP acceptance:
API changes:
UI routes:
Tenant safety check:
Docs updated: [ ] SERVICES-CATALOG [ ] VENDOR.md [ ] API modules
```

---

## Related links

- [Vendor docs index](./README.md)  
- [Vendor system design](./SYSTEM-DESIGN.md)  
- [Schema design & workflows](./SCHEMA-DESIGN.md)  
- [UI / UX planning](./UI-UX-PLANNING.md)  
- [Services catalog](./SERVICES-CATALOG.md)  
- [Operator how-to](../user-guides/VENDOR.md)  
- [System design](../01-SYSTEM-DESIGN.md) · [Project flow](../02-PROJECT-FLOW.md) · [API modules](../04-API-MODULES.md)  
