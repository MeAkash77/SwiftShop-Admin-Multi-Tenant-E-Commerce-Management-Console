# 01 — System Design

## 1. Purpose

**MultiCommerce** is a multi-vendor marketplace where:

- **Customers** browse products, checkout, and track orders  
- **Vendors** own a store, manage catalog/inventory/orders/marketing  
- **Super Admins** oversee the whole platform  

Isolation is **store/vendor based**: each vendor has one store; products and orders belong to that store.

---

## 2. High-level architecture

```text
┌─────────────────────┐     HTTPS / JSON      ┌──────────────────────────┐
│  React Frontend     │ ◄───────────────────► │  Express API (/api)       │
│  (Vite)             │   Bearer + cookies    │  server.js               │
│  - Customer shop    │                       │  MongoDB + Cloudinary    │
│  - Vendor panel     │                       │  Razorpay + Nodemailer   │
│  - Admin panel      │                       └────────────┬─────────────┘
└─────────────────────┘                                    │
                                                           ▼
                                                  ┌────────────────┐
                                                  │   MongoDB      │
                                                  │   Atlas / local│
                                                  └────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Redux Toolkit, React Router, Axios, Tailwind |
| Backend | Node.js, Express, Mongoose |
| DB | MongoDB |
| Media | Cloudinary |
| Payments | Razorpay |
| Email | Nodemailer (Gmail app password) |
| Hosting | Vercel (web + api) |

---

## 3. Roles (actors)

| Role | Code value | Portal | Responsibility |
|---|---|---|---|
| Super Admin | `superAdmin` | `/admin/*` | Users, stores, products, orders, categories, reports |
| Vendor | `vendor` | `/vendor/*` | Own store, products, inventory, orders, banners |
| Customer | `customer` | `/customer/*` | Browse, cart, checkout, addresses, reviews |

Auth portals:

- Customer → `/api/auth/*`  
- Vendor → `/api/vendor/auth/*`  
- Admin → `/api/admin/auth/*`  

---

## 4. Multi-tenancy model

```text
User (role=vendor)
   └── Store (vendorId UNIQUE — one store per vendor)
         ├── Product (store + vendor)
         ├── Banner (optional store)
         └── Order (storeId) ← Customer User
               └── OrderItem (productId)
```

- `User.tenantId` exists in schema for future use; **runtime isolation uses vendor + store IDs**.  
- Vendors only see products/orders for **their** store.  
- Orders are created **per store** (cart may split into multiple store checkouts).

---

## 5. Security design

| Concern | Approach |
|---|---|
| Access | Short-lived JWT (`Authorization: Bearer`) |
| Refresh | HttpOnly cookie `refreshToken` + `POST /auth/refresh` |
| Authorization | `authenticate` + `authorize('vendor'\|'superAdmin'\|…)` |
| Pricing | Server recalculates price/tax/shipping (`productPricing.js`) — client totals ignored |
| Payments | Razorpay signature + amount verification |
| Uploads | Multer memory → Cloudinary; spreadsheet multer for bulk import |
| Headers | Helmet; CORS from `CLIENT_URL` |

---

## 6. Frontend shells

| Shell | File | Notes |
|---|---|---|
| Customer storefront | `CustomerLayout.jsx` | Nav, search, cart |
| Vendor workspace | `VendorLayout.jsx` → `PanelLayout.jsx` | Light/dark theme, sidebar |
| Admin panel | `AdminLayout.jsx` | Dark analytics UI |
| Auth pages | `AuthLayout` / portal CSS | Login & register |

Route guard: `ProtectedRoute.jsx` checks token + role.

---

## 7. External services

```text
Frontend ──► API ──► MongoDB
               ├──► Cloudinary (images)
               ├──► Razorpay (online pay)
               └──► Email (OTP, order mail)
```

---

## 8. Design principles (for contributors)

1. **Trust the server** for money, stock, and order status.  
2. **Scope by ownership** (vendorId / storeId / customerId).  
3. **Keep carts client-side** until checkout posts to `/order/create`.  
4. **Document modules** in comments at the top of each major file.  
5. **Vendor-focused design** (requirements → architecture → roadmap): [docs/vendor/SYSTEM-DESIGN.md](./vendor/SYSTEM-DESIGN.md).  
