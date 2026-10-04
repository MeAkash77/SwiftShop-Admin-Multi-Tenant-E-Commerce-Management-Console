# Admin documentation (planning space)

This folder is the **platform-operator** planning area for MultiCommerce.

Use it to answer: *What does a Super Admin need to govern customers, vendors, and the marketplace?* then map each need to what the app already has, what is partial, and what to build next.

| Document | Purpose |
|----------|---------|
| **[SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md)** | Admin system design (control plane, domains, data, APIs, flows) |
| **[ACCESS-MATRIX.md](./ACCESS-MATRIX.md)** | Full access matrix — customers, vendors, catalog, money, ops |
| **[UI-UX-PLANNING.md](./UI-UX-PLANNING.md)** | Marketplace Control Plane UI/UX (source of truth) |
| **[SERVICES-CATALOG.md](./SERVICES-CATALOG.md)** | Admin services · Have / Partial / Missing |
| **[PLANNING.md](./PLANNING.md)** | Prioritized roadmap for admin panel waves |
| [User guide (how-to)](../user-guides/ADMIN.md) | Day-to-day operator steps (not planning) |

**Portal:** [/admin/login](https://multicommerce-web.vercel.app/admin/login) · First setup: [/admin/setup](https://multicommerce-web.vercel.app/admin/setup)

### How to use this space

1. Read **SYSTEM-DESIGN** — what an admin panel *is* on a marketplace.  
2. Read **ACCESS-MATRIX** — every permission an operator needs.  
3. Read **UI-UX-PLANNING** — nav, Home, record pages, visual language.  
4. Read **SERVICES-CATALOG** — confirm Have / Partial / Missing against the live portal.  
5. Pick work from **PLANNING** — one wave at a time.  
6. After shipping, update the catalog and access matrix.  
7. Keep the **user guide** for operators; keep this folder for product & eng.

### Admin mental model

```text
Marketplace Control Plane (not a single-store Shopify admin)

  Watch platform health → Intervene on people & stores
       → Moderate catalog & orders → Control money & trust
            → Configure platform rules → Audit what happened
```

This is closer to **Amazon Seller Central (ops side)** / **marketplace operator console** than to a vendor’s own store admin. Vendor Hub stays Shopify-plain; Admin is the **governance layer above vendors**.
