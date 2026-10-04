# MultiCommerce Documentation Index

How **MultiCommerce** is designed, how data moves, and how each role uses the product.

---

## Start here

| Document | What it covers |
|----------|----------------|
| [../README.md](../README.md) | Live demo, features, quick start |
| [06 — User Guidelines](./06-USER-GUIDELINES.md) | How-to for Customer, Vendor, Super Admin |
| [Customer](./user-guides/CUSTOMER.md) · [Vendor](./user-guides/VENDOR.md) · [Admin](./user-guides/ADMIN.md) | Role operator guides |

---

## Customer planning (shopping experience)

Product/engineering planning for what **daily shoppers** need — discovery, trust, checkout, tracking, returns, and repeat use.

| Document | What it covers |
|----------|----------------|
| **[customer/README.md](./customer/README.md)** | Customer docs index & north star |
| **[customer/SYSTEM-DESIGN.md](./customer/SYSTEM-DESIGN.md)** | Customer architecture, domains, data, APIs, flows |
| **[customer/UI-UX-PLANNING.md](./customer/UI-UX-PLANNING.md)** | Customer storefront and account UI/UX |
| **[customer/JOURNEY-ACCESS-MATRIX.md](./customer/JOURNEY-ACCESS-MATRIX.md)** | Journey stages, actions, access, stuck points |
| [customer/SERVICES-CATALOG.md](./customer/SERVICES-CATALOG.md) | Customer services · Have / Partial / Missing |
| [customer/PLANNING.md](./customer/PLANNING.md) | Prioritized roadmap (waves A–E) |

---

## Vendor planning (services space)

Product/engineering planning for what sellers need — before building more.

| Document | What it covers |
|----------|----------------|
| **[vendor/README.md](./vendor/README.md)** | Vendor docs index & journey |
| **[vendor/SYSTEM-DESIGN.md](./vendor/SYSTEM-DESIGN.md)** | Vendor architecture, domains, data, APIs, flows |
| **[vendor/SCHEMA-DESIGN.md](./vendor/SCHEMA-DESIGN.md)** | Schema design workflow + ER & data workflows |
| **[vendor/UI-UX-SHOPIFY-PLAIN.md](./vendor/UI-UX-SHOPIFY-PLAIN.md)** | Shopify-plain Seller Hub UI/UX |
| [vendor/UI-UX-PLANNING.md](./vendor/UI-UX-PLANNING.md) | UI/UX index |
| [vendor/SERVICES-CATALOG.md](./vendor/SERVICES-CATALOG.md) | Services vendors want · Have / Partial / Missing |
| [vendor/PLANNING.md](./vendor/PLANNING.md) | Prioritized roadmap (waves A–E) |

---

## Admin planning (control plane)

Product/engineering planning for what **platform operators** need to govern customers & vendors.

| Document | What it covers |
|----------|----------------|
| **[admin/README.md](./admin/README.md)** | Admin docs index & mental model |
| **[admin/SYSTEM-DESIGN.md](./admin/SYSTEM-DESIGN.md)** | Marketplace Control Plane architecture |
| **[admin/ACCESS-MATRIX.md](./admin/ACCESS-MATRIX.md)** | Full admin access (customers, vendors, money, trust) |
| **[admin/UI-UX-PLANNING.md](./admin/UI-UX-PLANNING.md)** | Operator console UI/UX |
| [admin/SERVICES-CATALOG.md](./admin/SERVICES-CATALOG.md) | Admin services · Have / Partial / Missing |
| [admin/PLANNING.md](./admin/PLANNING.md) | Roadmap waves A–E |

---

## Architecture & modules

| Document | What it covers |
|----------|----------------|
| [01 — System Design](./01-SYSTEM-DESIGN.md) | Architecture, roles, tenancy, security |
| [02 — Project Flow](./02-PROJECT-FLOW.md) | Auth, catalog, checkout, payments, invoices |
| [03 — Database Modules](./03-DATABASE-MODULES.md) | MongoDB collections, ER view |
| [04 — API Modules](./04-API-MODULES.md) | Backend folders, routes, middleware |
| [05 — Frontend Architecture](./05-FRONTEND-ARCHITECTURE.md) | React structure, Redux, layouts |

---

## Delivery, scale & ops

| Document | What it covers |
|----------|----------------|
| [07 — Performance (Vercel)](./07-PERFORMANCE-VERCEL.md) | Load + cold-start tips |
| [08 — Team 5-week plan](./08-TEAM-5WEEK-PLAN.md) | Roles, week map, checklist |
| [09 — Seeding (dev only)](./09-SEEDING-DEV-ONLY.md) | Demo/catalog seeds — not for CD |
| [10 — Scale (~5000 users)](./10-SCALE-5000-USERS.md) | Redis, Docker, pagination |
| [11 — Live API & capacity](./11-LIVE-API-RESPONSE-AND-CAPACITY.md) | Timings & concurrent users |

---

## Related root docs

- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) — local setup  
- [DEPLOYMENT.md](../DEPLOYMENT.md) — Vercel / production  
- [.github/CI_CD.md](../.github/CI_CD.md) — CI/CD pipeline  
- [DOCUMENTATION.md](../DOCUMENTATION.md) — full feature & API reference  

**Live:** Web https://multicommerce-web.vercel.app · API https://multicommerce-api.vercel.app  

