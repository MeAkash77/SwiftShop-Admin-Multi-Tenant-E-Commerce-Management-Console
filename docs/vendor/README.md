# Vendor documentation (planning space)

This folder is the **vendor-first** planning area for MultiCommerce.

Use it to answer: *What does a seller need to run a store successfully?* then map each need to what the app already has, what is partial, and what to build next.

| Document | Purpose |
|----------|---------|
| **[SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md)** | Vendor system design (architecture, domains, data, APIs, flows) |
| **[SCHEMA-DESIGN.md](./SCHEMA-DESIGN.md)** | Schema design workflow + ER, state & write workflows |
| **[UI-UX-SHOPIFY-PLAIN.md](./UI-UX-SHOPIFY-PLAIN.md)** | Shopify-plain Seller Hub plan (source of truth) |
| **[UI-UX-PLANNING.md](./UI-UX-PLANNING.md)** | Short index → Shopify-plain plan |
| **[SERVICES-CATALOG.md](./SERVICES-CATALOG.md)** | Full service list vendors expect · status in app · where it lives |
| **[PLANNING.md](./PLANNING.md)** | Prioritized roadmap for missing / partial services |
| [User guide (how-to)](../user-guides/VENDOR.md) | Day-to-day operator steps (not planning) |

**Portal:** [/vendor/login](https://multicommerce-web.vercel.app/vendor/login) · [/vendor/register](https://multicommerce-web.vercel.app/vendor/register)

### How to use this space

1. Read **SYSTEM-DESIGN** — vendor architecture, domains, data, APIs, flows.  
2. Read **SCHEMA-DESIGN** — how to change schemas + ER / state workflows.  
3. Read **UI-UX-SHOPIFY-PLAIN** — plain Shopify Admin look & flow.  
4. Read **SERVICES-CATALOG** — confirm “have / partial / missing” against the live portal.  
5. Pick work from **PLANNING** — one service slice at a time (pair with UI phases).  
6. After shipping a slice, update the catalog status and planning checklist.  
7. Keep the **user guide** for operators; keep this folder for product & eng planning.

### Vendor journey (current product)

```text
Register → OTP → Login
    → Store profile → Shipping & returns
    → Products / bulk import → Inventory & alerts
    → Orders & payment status → Coupons & marketing
    → Support chat & reviews → Settings / profile
```
